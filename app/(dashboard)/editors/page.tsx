import { TeamManager } from "@/components/team-manager";
import { createClient } from "@/lib/supabase/server";

function isEditor(member: Record<string, any>) {
  const text = `${member.role ?? ""} ${member.designation ?? ""} ${member.specialty ?? ""}`.toLowerCase();
  return text.includes("editor") || text.includes("edit") || text.includes("reel") || text.includes("album") || text.includes("both");
}

function isShooter(member: Record<string, any>) {
  const text = `${member.role ?? ""} ${member.designation ?? ""} ${member.specialty ?? ""}`.toLowerCase();
  return text.includes("shooter") || text.includes("photo") || text.includes("video") || text.includes("shoot") || text.includes("both");
}

export default async function TeamPage() {
  const supabase = createClient();
  const [{ data: team, error: teamError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from("team_members").select("*").order("name"),
    supabase
      .from("editing_tasks")
      .select("id,photo_editor_id,video_editor_id,task_type,status,delivery_date,events:event_id(event_name,event_date),clients:client_id(host_name),photo_editor:photo_editor_id(name),video_editor:video_editor_id(name)")
      .order("delivery_date", { ascending: true })
  ]);

  if (teamError) throw new Error(teamError.message);
  if (taskError) throw new Error(taskError.message);

  const teamRows = (team ?? []) as Record<string, any>[];
  const taskRows = (tasks ?? []) as Record<string, any>[];
  const shooters = teamRows.filter((member) => isShooter(member));
  const editors = teamRows.filter((member) => isEditor(member));

  return <TeamManager shooters={shooters} editors={editors} tasks={taskRows} />;
}
