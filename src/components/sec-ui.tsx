import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const pill = cva("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide", {
  variants: {
    tone: {
      ALLOW: "border-success/40 bg-success/10 text-success",
      REDACT: "border-primary/40 bg-primary/10 text-primary",
      REVIEW: "border-warning/40 bg-warning/10 text-warning",
      BLOCK: "border-destructive/50 bg-destructive/15 text-destructive",
      low: "border-success/40 bg-success/10 text-success",
      medium: "border-warning/40 bg-warning/10 text-warning",
      high: "border-caution/50 bg-caution/10 text-caution",
      critical: "border-destructive/50 bg-destructive/15 text-destructive",
      muted: "border-border bg-muted text-muted-foreground",
    },
  },
  defaultVariants: { tone: "muted" },
});

type Tone = "ALLOW" | "REDACT" | "REVIEW" | "BLOCK" | "low" | "medium" | "high" | "critical" | "muted";

export function Pill({ tone, children, className }: { tone?: string; children?: ReactNode; className?: string }) {
  return <span className={cn(pill({ tone: (tone as Tone) ?? "muted" }), className)}>{children ?? tone}</span>;
}

export function SimLabel() {
  return (
    <span className="inline-flex items-center rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warning">
      Simulated
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "primary" | "destructive" | "warning" | "success" }) {
  const color = { primary: "text-primary", destructive: "text-destructive", warning: "text-warning", success: "text-success" }[tone ?? "primary"];
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-mono text-3xl font-semibold", color)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 border-dashed p-10 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function fmtTime(s: string) {
  return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ResultCard({ r }: { r: { decision: string; threatLevel: string; reasons: string[]; executed: boolean; output?: string | null; findings?: { label: string; type: string }[] } }) {
  return (
    <div className="panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={r.decision} />
        <Pill tone={r.threatLevel}>threat: {r.threatLevel}</Pill>
        <span className={cn("font-mono text-xs", r.executed ? "text-success" : "text-destructive")}>
          {r.executed ? "● action executed (simulated)" : "■ action NOT executed"}
        </span>
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
      {r.findings && r.findings.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.findings.map((f, i) => <Pill key={i} tone={f.type === "injection" ? "critical" : f.type === "secret" ? "high" : "medium"}>{f.label}</Pill>)}
        </div>
      )}
      {r.output && <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">{r.output}</pre>}
    </div>
  );
}
