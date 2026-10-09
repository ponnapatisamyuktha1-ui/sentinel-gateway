import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const q = <T,>(key: string, fn: () => Promise<T>) => queryOptions({ queryKey: [key], queryFn: fn });

export const agentsQ = q("agents", async () => (await supabase.from("agents").select("*").order("created_at")).data ?? []);
export const resourcesQ = q("resources", async () => (await supabase.from("resources").select("*").order("path")).data ?? []);
export const policyQ = q("policy", async () => (await supabase.from("policies").select("*").maybeSingle()).data);
export const emailsQ = q("emails", async () => (await supabase.from("emails").select("*").order("received_at", { ascending: false })).data ?? []);
export const logsQ = q("audit_logs", async () =>
  (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
);
