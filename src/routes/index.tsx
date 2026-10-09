import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Mail, ScanSearch, ShieldCheck, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel AI — AI Agent Security Gateway" },
      { name: "description", content: "A security gateway that inspects every AI agent action and blocks data leaks, prompt injection and unauthorized access." },
      { property: "og:title", content: "Sentinel AI — AI Agent Security Gateway" },
      { property: "og:description", content: "Inspect, redact, review or block every AI agent action before it executes." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Mail, t: "Untrusted email", d: "Detects prompt injection and hidden instructions before agents act." },
  { icon: ScanSearch, t: "Data loss prevention", d: "Finds passwords, API keys and personal data, then redacts or blocks." },
  { icon: ShieldCheck, t: "Deny-by-default gateway", d: "ALLOW · REDACT · REVIEW · BLOCK — enforced on the server." },
  { icon: FlaskConical, t: "Attack lab", d: "Run safe attack scenarios against the real checks." },
];

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex h-20 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><Shield className="h-6 w-6 text-primary" /> Sentinel AI</div>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="flex flex-1 flex-col justify-center py-16">
        <span className="mb-6 w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">AI AGENT SECURITY GATEWAY</span>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Your AI agents act fast.<br /><span className="text-primary">Sentinel decides if they should.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Every file read, tool call and outgoing email passes through a backend checkpoint that blocks leaks, injection and overreach — before anything executes.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Launch the demo</Link></Button>
        </div>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Demo uses synthetic data and simulated agents. No real email or AI services are connected.</p>
        <div className="mt-16 grid gap-4 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="panel p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
