import { Camera, Clapperboard, Scissors } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { prettyDate } from "@/lib/utils";

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

  const shooters = (team ?? []).filter((member) => isShooter(member));
  const editors = (team ?? []).filter((member) => isEditor(member));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Team</h2>
        <p className="mt-1 text-sm text-zinc-500">Shooters, editors, and assigned editing projects.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Camera className="h-5 w-5 text-brand" />
            <h3 className="font-semibold text-ink">Shooters</h3>
          </div>
          <div className="divide-y divide-line">
            {shooters.length === 0 ? (
              <div className="p-5"><EmptyState title="No shooters yet" text="Add team members with Photo, Video, or Shooter designation." /></div>
            ) : (
              shooters.map((member) => (
                <div key={member.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{member.name}</p>
                      <p className="text-sm text-zinc-500">{member.designation ?? member.specialty ?? "Shooter"}</p>
                    </div>
                    <p className="text-sm font-semibold text-brand">{member.total_hours_worked ?? 0} hrs</p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">{member.contact_no ?? "No contact"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Scissors className="h-5 w-5 text-brand" />
            <h3 className="font-semibold text-ink">Editors</h3>
          </div>
          <div className="divide-y divide-line">
            {editors.length === 0 ? (
              <div className="p-5"><EmptyState title="No editors yet" text="Add team members with Editor, Reel, or Album designation." /></div>
            ) : (
              editors.map((member) => {
                const assigned = (tasks ?? []).filter((task) => {
                  return task.photo_editor_id === member.id || task.video_editor_id === member.id;
                });
                return (
                  <div key={member.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{member.name}</p>
                        <p className="text-sm text-zinc-500">{member.designation ?? member.specialty ?? "Editor"}</p>
                      </div>
                      <p className="text-sm font-semibold text-brand">{assigned.length} project{assigned.length === 1 ? "" : "s"}</p>
                    </div>
                    {assigned.length ? (
                      <div className="mt-3 grid gap-2">
                        {assigned.map((task) => (
                          <div key={task.id} className="rounded-md border border-line bg-mist/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                  <Clapperboard className="h-4 w-4 text-zinc-500" />
                                  {(task.events as any)?.event_name ?? (task.clients as any)?.host_name ?? task.task_type}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {task.task_type} · delivery {prettyDate(task.delivery_date)}
                                </p>
                              </div>
                              <StatusBadge value={task.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500">No projects assigned.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
