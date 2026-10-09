import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  evaluate,
  emailRisk,
  redact,
  scanText,
  extractEmails,
  type GatewayRequest,
  type GatewayResult,
} from "./engine";
import { SCENARIOS } from "./scenarios";

type Ctx = { supabase: any; userId: string };

async function loadContext(ctx: Ctx, agentId: string | null) {
  const [agent, policy, resources] = await Promise.all([
    agentId
      ? ctx.supabase.from("agents").select("*").eq("id", agentId).maybeSingle()
      : Promise.resolve({ data: null }),
    ctx.supabase.from("policies").select("*").eq("owner_id", ctx.userId).maybeSingle(),
    ctx.supabase.from("resources").select("path,classification"),
  ]);
  return { agent: agent.data, policy: policy.data, resources: resources.data ?? [] };
}

/** Simulated executor. Only ever invoked after ALLOW/REDACT. */
function execute(req: GatewayRequest, result: GatewayResult) {
  const content = result.sanitizedContent ?? "";
  switch (req.action) {
    case "file.read":
      return `[SIMULATED] Returned synthetic contents of ${req.resource}`;
    case "email.send":
      return `[SIMULATED] Email queued to ${req.destination} (not actually sent): "${content.slice(0, 140)}"`;
    default:
      return `[SIMULATED] Tool ${req.tool} executed`;
  }
}

async function runGateway(ctx: Ctx, agentId: string | null, req: GatewayRequest, source: string) {
  const { agent, policy, resources } = await loadContext(ctx, agentId);
  const result = evaluate(req, agent, policy, resources);
  const allowed = result.decision === "ALLOW" || result.decision === "REDACT";
  const output = allowed ? execute(req, result) : null; // blocked/review actions never execute

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    owner_id: ctx.userId,
    agent_name: agent?.name ?? "unknown-agent",
    action: req.action === "tool.call" ? req.tool : req.action,
    target: req.resource || req.destination || req.tool,
    threat_level: result.threatLevel,
    decision: result.decision,
    reasons: result.reasons,
    source,
    executed: allowed,
  });
  return { ...result, executed: allowed, output, findings: result.findings.map((f) => ({ ...f, match: redact(f.match) })) };
}

const reqValidator = (input: { agentId: string | null; request: GatewayRequest }) => {
  const r = input.request;
  if (!["tool.call", "file.read", "email.send"].includes(r.action)) throw new Error("Invalid action");
  const clip = (s?: string) => (s ?? "").slice(0, 10000);
  return {
    agentId: input.agentId,
    request: { action: r.action, tool: clip(r.tool), resource: clip(r.resource), destination: clip(r.destination), content: clip(r.content), untrustedSource: clip(r.untrustedSource) },
  };
};

export const gatewayEvaluate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(reqValidator)
  .handler(async ({ data, context }) => runGateway(context as Ctx, data.agentId, data.request as GatewayRequest, "gateway"));

export const scanEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { emailId: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: email } = await context.supabase.from("emails").select("*").eq("id", data.emailId).maybeSingle();
    if (!email) throw new Error("Email not found");
    const r = emailRisk(email.body);
    const scan = {
      level: r.level,
      injections: [...new Set(r.injections.map((f) => f.label))],
      secrets: [...new Set(r.secrets.map((f) => f.label))],
      pii: [...new Set(r.pii.map((f) => f.label))],
      redactedBody: redact(email.body),
      scannedAt: new Date().toISOString(),
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("emails").update({ scan }).eq("id", email.id).eq("owner_id", context.userId);
    if (r.level !== "low") {
      await supabaseAdmin.from("audit_logs").insert({
        owner_id: context.userId,
        agent_name: "EmailScanner",
        action: "email.scan",
        target: email.sender,
        threat_level: r.level,
        decision: r.injections.length ? "BLOCK" : "REDACT",
        reasons: [...scan.injections.map((x) => `Injection: ${x}`), ...scan.secrets.map((x) => `Secret: ${x}`), ...scan.pii.map((x) => `PII: ${x}`)],
        source: "email",
        executed: false,
      });
    }
    return scan;
  });

/** The inbox agent processes an email. Email body is untrusted input. */
export const agentProcessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { emailId: string }) => i)
  .handler(async ({ data, context }) => {
    const { data: email } = await context.supabase.from("emails").select("*").eq("id", data.emailId).maybeSingle();
    if (!email) throw new Error("Email not found");
    const { data: agent } = await context.supabase.from("agents").select("id").eq("name", "InboxAssistant").maybeSingle();
    const exfilTarget = extractEmails(email.body).find((e) => e.toLowerCase() !== email.sender.toLowerCase());
    const instructed = /\b(forward|send)\b/i.test(email.body) && exfilTarget;
    const req: GatewayRequest = {
      action: "email.send",
      tool: "email.send",
      destination: instructed ? exfilTarget : email.sender,
      content: instructed ? email.body : `Thanks for your message regarding "${email.subject}". Summary: ${email.body.slice(0, 200)}`,
      untrustedSource: email.body,
    };
    const result = await runGateway(context as Ctx, agent?.id ?? null, req, "email");
    return { ...result, attempted: req.destination, modelInput: redact(email.body) };
  });

export const dlpScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { text: string }) => ({ text: String(i.text ?? "").slice(0, 20000) }))
  .handler(async ({ data }) => {
    const s = scanText(data.text);
    const strip = (fs: typeof s.all) => fs.map((f) => ({ type: f.type, label: f.label, preview: redact(f.match) }));
    return {
      findings: strip(s.all),
      redacted: redact(data.text),
      verdict: s.injections.length || s.secrets.length ? "BLOCK" : s.pii.length ? "REDACT" : "ALLOW",
    };
  });

export const runScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { scenarioId: string }) => i)
  .handler(async ({ data, context }) => {
    const sc = SCENARIOS.find((s) => s.id === data.scenarioId);
    if (!sc) throw new Error("Unknown scenario");
    const { data: agent } = await context.supabase.from("agents").select("id").eq("name", sc.agent).maybeSingle();
    const result = await runGateway(context as Ctx, agent?.id ?? null, sc.request, "simulation");
    return { ...result, expected: sc.expected, passed: sc.expected.includes(result.decision) };
  });
