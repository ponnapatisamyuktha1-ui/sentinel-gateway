// Pure security engine. Executed on the server by gateway.functions.ts.
// The browser may import types/labels from here but never makes decisions.

export type Decision = "ALLOW" | "REDACT" | "REVIEW" | "BLOCK";
export type ThreatLevel = "low" | "medium" | "high" | "critical";
export type Classification = "public" | "internal" | "confidential" | "restricted";

export const CLASS_RANK: Record<string, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

export interface Finding {
  type: "secret" | "pii" | "injection";
  label: string;
  match: string;
}

const SECRET_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Stripe-style API key", re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g },
  { label: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { label: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { label: "JWT token", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g },
  { label: "Password", re: /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/gi },
  { label: "API key assignment", re: /\b(?:api[_-]?key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{8,}/gi },
];

const PII_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: "Credit card", re: /\b(?:\d[ -]?){13,16}\b/g },
  { label: "Email address", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { label: "Phone number", re: /\b(?:\+?\d{1,2}[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/g },
];

const INJECTION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Instruction override", re: /ignore (?:all |any )?(?:previous|prior|above) (?:instructions|rules)/gi },
  { label: "Role hijack", re: /\byou are now\b[^.]{0,60}/gi },
  { label: "Concealment request", re: /do not (?:tell|inform|notify) the user/gi },
  { label: "Exfiltration instruction", re: /\b(?:forward|send|upload|exfiltrate)\b[^.]{0,80}\bto\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/gi },
  { label: "Hidden instruction addressed to AI", re: /<!--[^>]*\b(?:AI|agent|assistant)s?\b[^>]*-->/gi },
  { label: "System prompt probe", re: /(?:reveal|print|show) (?:your )?(?:system prompt|hidden instructions)/gi },
  { label: "Secret file request", re: /\b(?:read|open|cat)\b[^.]{0,40}(?:\.env|secrets?|credentials|id_rsa)/gi },
];

function collect(text: string, type: Finding["type"], pats: { label: string; re: RegExp }[]) {
  const out: Finding[] = [];
  for (const p of pats) {
    for (const m of text.matchAll(new RegExp(p.re.source, p.re.flags))) {
      out.push({ type, label: p.label, match: m[0] });
    }
  }
  return out;
}

export function scanText(text: string) {
  const secrets = collect(text, "secret", SECRET_PATTERNS);
  // Avoid flagging the same span as both secret and PII
  const pii = collect(text, "pii", PII_PATTERNS).filter(
    (f) => !secrets.some((s) => s.match.includes(f.match)),
  );
  const injections = collect(text, "injection", INJECTION_PATTERNS);
  return { secrets, pii, injections, all: [...injections, ...secrets, ...pii] };
}

export function redact(text: string) {
  let out = text;
  for (const p of SECRET_PATTERNS) out = out.replace(new RegExp(p.re.source, p.re.flags), "[REDACTED:SECRET]");
  for (const p of PII_PATTERNS) out = out.replace(new RegExp(p.re.source, p.re.flags), `[REDACTED:${p.label.toUpperCase().replace(/ /g, "_")}]`);
  return out;
}

export function extractEmails(text: string) {
  return Array.from(text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)).map((m) => m[0]);
}

export interface AgentCtx {
  name: string;
  status: string;
  clearance: string;
  allowed_tools: string[];
  allowed_resources: string[];
}
export interface PolicyCtx {
  trusted_domains: string[];
  prohibited_tools: string[];
  approval_required_tools: string[];
  redact_pii: boolean;
  block_secrets: boolean;
  review_confidential_external: boolean;
}
export interface ResourceCtx {
  path: string;
  classification: string;
}

export interface GatewayRequest {
  action: "tool.call" | "file.read" | "email.send";
  tool: string;
  resource?: string;
  destination?: string;
  content?: string;
  untrustedSource?: string; // e.g. text of an email that triggered this action
}

export interface GatewayResult {
  decision: Decision;
  threatLevel: ThreatLevel;
  reasons: string[];
  findings: Finding[];
  sanitizedContent?: string;
}

function globMatch(pattern: string, path: string) {
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  return re.test(path);
}

export function domainOf(addr: string) {
  return addr.split("@").pop()?.toLowerCase().trim() ?? "";
}

/**
 * Deny-by-default decision. Every check must pass for ALLOW.
 */
export function evaluate(
  req: GatewayRequest,
  agent: AgentCtx | null,
  policy: PolicyCtx | null,
  resources: ResourceCtx[],
): GatewayResult {
  const reasons: string[] = [];
  const block = (lvl: ThreatLevel, ...r: string[]): GatewayResult => ({
    decision: "BLOCK",
    threatLevel: lvl,
    reasons: [...reasons, ...r],
    findings,
  });
  const text = [req.content ?? "", req.untrustedSource ?? ""].join("\n");
  const scan = scanText(text);
  const findings = scan.all;

  if (!agent) return block("high", "Unknown agent — denied by default");
  if (!policy) return block("high", "No policy configured — denied by default");
  if (agent.status !== "active") return block("medium", `Agent is ${agent.status}`);
  if (!req.tool) return block("medium", "No tool specified");
  if (policy.prohibited_tools.includes(req.tool)) return block("critical", `Tool '${req.tool}' is prohibited by policy`);
  if (!agent.allowed_tools.includes(req.tool)) return block("high", `Tool '${req.tool}' not granted to ${agent.name}`);

  if (scan.injections.length) {
    return block("critical", `Prompt-injection detected in untrusted input: ${[...new Set(scan.injections.map((i) => i.label))].join(", ")}`);
  }

  if (req.action === "file.read") {
    const path = req.resource ?? "";
    const res = resources.find((r) => r.path === path);
    if (!res) return block("high", `Resource '${path}' is not registered — denied by default`);
    if (!agent.allowed_resources.some((p) => globMatch(p, path)))
      return block("high", `Resource '${path}' is outside ${agent.name}'s scope`);
    if ((CLASS_RANK[res.classification] ?? 99) > (CLASS_RANK[agent.clearance] ?? -1))
      return block("critical", `'${res.classification}' data exceeds agent clearance '${agent.clearance}'`);
    reasons.push(`Within scope; ${res.classification} ≤ clearance ${agent.clearance}`);
  }

  let external = false;
  if (req.action === "email.send") {
    const dest = req.destination ?? "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dest)) return block("medium", "Invalid or missing destination");
    const trusted = policy.trusted_domains.some((d) => domainOf(dest) === d.toLowerCase() || domainOf(dest).endsWith("." + d.toLowerCase()));
    external = !trusted;
    if (external && scan.secrets.length) return block("critical", `Attempted transfer of secrets to untrusted destination ${dest}`);
    reasons.push(trusted ? "Destination domain is trusted" : `Destination ${domainOf(dest)} is not trusted`);
  }

  if (scan.secrets.length && policy.block_secrets)
    return block("high", `Secrets detected in outgoing content: ${[...new Set(scan.secrets.map((s) => s.label))].join(", ")}`);

  if (external && policy.review_confidential_external) {
    return { decision: "REVIEW", threatLevel: "medium", reasons: [...reasons, "Outgoing data to untrusted destination requires human approval"], findings, sanitizedContent: redact(req.content ?? "") };
  }
  if (policy.approval_required_tools.includes(req.tool) && external) {
    return { decision: "REVIEW", threatLevel: "medium", reasons: [...reasons, `Tool '${req.tool}' requires approval`], findings };
  }

  if (scan.pii.length && policy.redact_pii) {
    return {
      decision: "REDACT",
      threatLevel: "medium",
      reasons: [...reasons, `PII redacted: ${[...new Set(scan.pii.map((p) => p.label))].join(", ")}`],
      findings,
      sanitizedContent: redact(req.content ?? ""),
    };
  }

  return { decision: "ALLOW", threatLevel: "low", reasons: reasons.length ? reasons : ["All checks passed"], findings, sanitizedContent: req.content };
}

export function emailRisk(body: string) {
  const s = scanText(body);
  const level: ThreatLevel = s.injections.length ? "critical" : s.secrets.length ? "high" : s.pii.length ? "medium" : "low";
  return { level, ...s };
}
