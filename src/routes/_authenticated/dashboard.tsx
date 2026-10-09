import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { logsQ, emailsQ, agentsQ } from "@/lib/data";
import { Empty, PageHeader, Pill, Stat, fmtTime } from "@/components/sec-ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sentinel AI" }, { name: "description", content: "Security overview of AI agent activity." }, { property: "og:title", content: "Dashboard — Sentinel AI" }, { property: "og:description", content: "Security overview of AI agent activity." }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(logsQ), context.queryClient.ensureQueryData(emailsQ), context.queryClient.ensureQueryData(agentsQ)]),
  component: Dashboard,
});

const DEC_COLORS: Record<string, string> = { ALLOW: "var(--chart-1)", REDACT: "var(--chart-2)", REVIEW: "var(--chart-3)", BLOCK: "var(--chart-4)" };

function Dashboard() {
  const { data: logs } = useSuspenseQuery(logsQ);
  const { data: emails } = useSuspenseQuery(emailsQ);
  const { data: agents } = useSuspenseQuery(agentsQ);
  const blocked = logs.filter((l) => l.decision === "BLOCK").length;
  const sensitive = logs.filter((l) => l.reasons.some((r) => /PII|Secret|secret|redact/i.test(r))).length;
  const incidents = logs.filter((l) => l.threat_level === "high" || l.threat_level === "critical").slice(0, 6);
  const byDecision = ["ALLOW", "REDACT", "REVIEW", "BLOCK"].map((d) => ({ name: d, value: logs.filter((l) => l.decision === d).length }));
  const byAgent = Object.entries(logs.reduce<Record<string, number>>((a, l) => ((a[l.agent_name] = (a[l.agent_name] ?? 0) + (l.decision === "BLOCK" ? 1 : 0)), a), {})).map(([name, blocks]) => ({ name, blocks }));
  const posture = logs.length ? Math.round(100 - (logs.filter((l) => l.threat_level === "critical" && l.executed).length / logs.length) * 100) : 100;

  return (
    <>
      <PageHeader title="Security Dashboard" subtitle="Live overview of every request your simulated AI agents sent through the gateway." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Requests inspected" value={logs.length} hint={`${agents.filter((a) => a.status === "active").length} active agents`} />
        <Stat label="Threats blocked" value={blocked} tone="destructive" hint="Never executed" />
        <Stat label="Sensitive-data alerts" value={sensitive} tone="warning" hint={`${emails.filter((e) => e.scan && (e.scan as any).level !== "low").length} flagged emails`} />
        <Stat label="Containment" value={`${posture}%`} tone="success" hint="Critical threats stopped" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <div className="mb-2 text-sm font-medium">Gateway decisions</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byDecision} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                  {byDecision.map((d) => <Cell key={d.name} fill={DEC_COLORS[d.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2">{byDecision.map((d) => <Pill key={d.name} tone={d.name}>{d.name} {d.value}</Pill>)}</div>
        </div>
        <div className="panel p-5 lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Blocked actions by agent</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byAgent}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="blocks" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Recent incidents</h2><Link to="/audit" className="text-sm text-primary">View all logs →</Link></div>
        {incidents.length === 0 ? <Empty title="No incidents yet">Run a scenario in the <Link to="/lab" className="text-primary">Attack Simulation Lab</Link>.</Empty> : (
          <div className="panel divide-y divide-border">
            {incidents.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <Pill tone={l.threat_level} />
                <Pill tone={l.decision} />
                <span className="font-medium">{l.agent_name}</span>
                <span className="font-mono text-xs text-muted-foreground">{l.action} → {l.target}</span>
                <span className="flex-1 truncate text-muted-foreground">{l.reasons[0]}</span>
                <span className="font-mono text-xs text-muted-foreground">{fmtTime(l.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
