import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Mail, Bot, ScanSearch, ShieldCheck, Radar, SlidersHorizontal, ScrollText, FlaskConical, BookOpen, LogOut, Menu, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/emails", label: "Email Security", icon: Mail },
  { to: "/agents", label: "Agent Monitor", icon: Bot },
  { to: "/dlp", label: "Data Loss Prevention", icon: ScanSearch },
  { to: "/gateway", label: "Security Gateway", icon: ShieldCheck },
  { to: "/threats", label: "Threat Detection", icon: Radar },
  { to: "/policies", label: "Policy Manager", icon: SlidersHorizontal },
  { to: "/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/lab", label: "Attack Simulation Lab", icon: FlaskConical },
  { to: "/setup", label: "Setup & Docs", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <div className="font-semibold leading-none">Sentinel AI</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agent Security Gateway</div>
          </div>
        </div>
        <nav className="space-y-0.5 p-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow" }}>
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border p-3">
          <div className="mb-2 rounded-md border border-warning/30 bg-warning/5 p-2 text-[11px] text-warning">
            Demo mode: all agents, emails and integrations are simulated with synthetic data.
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-semibold">Sentinel AI</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
