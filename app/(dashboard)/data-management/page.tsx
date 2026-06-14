import { DataManagement } from "@/components/data-management";
import { pipelineStatuses } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";

function isEditor(member: Record<string, any>) {
  const text = `${member.role ?? ""} ${member.designation ?? ""} ${member.specialty ?? ""}`.toLowerCase();
  return text.includes("editor") || text.includes("edit") || text.includes("album") || text.includes("both");
}

export default async function DataManagementPage() {
  const supabase = createClient();

  const [{ data: events, error: eventError }, { data: team, error: teamError }] = await Promise.all([
    supabase
      .from("events")
      .select("*,clients:client_id(id,host_name,contact_no,client_number)")
      .in("status", pipelineStatuses)
      .order("event_date", { ascending: true }),
    supabase.from("team_members").select("id,name,role,designation,specialty").order("name")
  ]);

  if (eventError) throw new Error(eventError.message);
  if (teamError) throw new Error(teamError.message);

  const eventRows = (events ?? []) as Record<string, any>[];
  const editors = ((team ?? []) as Record<string, any>[])
    .filter(isEditor)
    .map((member) => ({ id: member.id, name: member.name, role: member.role }));

  return <DataManagement events={eventRows} editors={editors} />;
}
