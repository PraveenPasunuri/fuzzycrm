import { TeamManager } from "@/components/team-manager";
import { createClient } from "@/lib/supabase/server";

function isEditor(member: Record<string, any>) {
  const text = `${member.role ?? ""} ${member.designation ?? ""} ${member.specialty ?? ""}`.toLowerCase();
  return text.includes("editor") || text.includes("edit") || text.includes("album") || text.includes("both");
}

function isShooter(member: Record<string, any>) {
  const text = `${member.role ?? ""} ${member.designation ?? ""} ${member.specialty ?? ""}`.toLowerCase();
  return text.includes("photo") || text.includes("video") || text.includes("reel maker") || text.includes("shooter") || text.includes("shoot") || text.includes("both");
}

export default async function TeamPage() {
  const supabase = createClient();
  const [{ data: team, error: teamError }, { data: tasks, error: taskError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from("team_members").select("*").order("name"),
    supabase
      .from("editing_tasks")
      .select("id,photo_editor_id,video_editor_id,task_type,status,delivery_date,events:event_id(event_name,event_date),clients:client_id(host_name),photo_editor:photo_editor_id(name),video_editor:video_editor_id(name)")
      .order("delivery_date", { ascending: true }),
    supabase.from("events").select("id,event_name,event_date,photo_shooter_id,video_shooter_id,total_initial_hours,extra_hours,total_hours").order("event_date", { ascending: true })
  ]);

  if (teamError) throw new Error(teamError.message);
  if (taskError) throw new Error(taskError.message);
  if (eventError) throw new Error(eventError.message);

  const teamRows = (team ?? []) as Record<string, any>[];
  const taskRows = (tasks ?? []) as Record<string, any>[];
  const eventRows = (events ?? []) as Record<string, any>[];
  const shooters = teamRows.filter((member) => isShooter(member));
  const editors = teamRows.filter((member) => isEditor(member));

  return <TeamManager shooters={shooters} editors={editors} tasks={taskRows} events={eventRows} />;
}
