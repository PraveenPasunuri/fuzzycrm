"use client";

import { useState, useTransition } from "react";
import { Camera, Clapperboard, Edit, Plus, Scissors, Trash2, X } from "lucide-react";
import { deleteRecord, saveRecord } from "@/lib/actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { prettyDate } from "@/lib/utils";

type Props = {
  shooters: Record<string, any>[];
  editors: Record<string, any>[];
  tasks: Record<string, any>[];
};

const fields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "role", label: "Role", type: "select", options: ["Shooter", "Editor", "Both"], required: true },
  { name: "designation", label: "Designation", type: "text", placeholder: "Photo Shooter, Video Shooter, Photo Editor..." },
  { name: "contact_no", label: "Contact no", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "specialty", label: "Specialty", type: "text" },
  { name: "total_hours_worked", label: "Total no of hours worked", type: "number" },
  { name: "payment_terms", label: "Payment terms", type: "text" },
  { name: "notes", label: "Notes", type: "textarea" }
];

function defaultMember(role: "Shooter" | "Editor") {
  return {
    role,
    designation: role === "Shooter" ? "Photo Shooter" : "Photo Editor",
    total_hours_worked: 0
  };
}

export function TeamManager({ shooters, editors, tasks }: Props) {
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addMember(role: "Shooter" | "Editor") {
    setEditing(defaultMember(role));
    setOpen(true);
  }

  function editMember(member: Record<string, any>) {
    setEditing(member);
    setOpen(true);
  }

  function removeMember(member: Record<string, any>) {
    if (!window.confirm(`Delete ${member.name}? This action cannot be undone.`)) return;
    startTransition(async () => {
      await deleteRecord("editors", member.id);
    });
  }

  function assignedProjects(member: Record<string, any>) {
    return tasks.filter((task) => task.photo_editor_id === member.id || task.video_editor_id === member.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Team</h2>
        <p className="mt-1 text-sm text-zinc-500">Shooters, editors, and assigned editing projects.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-brand" />
              <h3 className="font-semibold text-ink">Shooters</h3>
            </div>
            <button onClick={() => addMember("Shooter")} className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#176274]">
              <Plus className="h-4 w-4" />
              Add Shooter
            </button>
          </div>
          <div className="divide-y divide-line">
            {shooters.length === 0 ? (
              <div className="p-5"><EmptyState title="No shooters yet" text="Add team members with Photo, Video, or Shooter designation." /></div>
            ) : (
              shooters.map((member) => (
                <div key={member.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{member.name}</p>
                      <p className="text-sm text-zinc-500">{member.designation ?? member.specialty ?? "Shooter"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand">{member.total_hours_worked ?? 0} hrs</p>
                      <button aria-label="Edit shooter" title="Edit shooter" onClick={() => editMember(member)} className="rounded-md border border-line p-2 text-zinc-600 hover:bg-mist">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button aria-label="Delete shooter" title="Delete shooter" disabled={isPending} onClick={() => removeMember(member)} className="rounded-md border border-line p-2 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">{member.contact_no ?? "No contact"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-brand" />
              <h3 className="font-semibold text-ink">Editors</h3>
            </div>
            <button onClick={() => addMember("Editor")} className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#176274]">
              <Plus className="h-4 w-4" />
              Add Editor
            </button>
          </div>
          <div className="divide-y divide-line">
            {editors.length === 0 ? (
              <div className="p-5"><EmptyState title="No editors yet" text="Add team members with Editor, Reel, or Album designation." /></div>
            ) : (
              editors.map((member) => {
                const assigned = assignedProjects(member);
                return (
                  <div key={member.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{member.name}</p>
                        <p className="text-sm text-zinc-500">{member.designation ?? member.specialty ?? "Editor"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand">{assigned.length} project{assigned.length === 1 ? "" : "s"}</p>
                        <button aria-label="Edit editor" title="Edit editor" onClick={() => editMember(member)} className="rounded-md border border-line p-2 text-zinc-600 hover:bg-mist">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button aria-label="Delete editor" title="Delete editor" disabled={isPending} onClick={() => removeMember(member)} className="rounded-md border border-line p-2 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {assigned.length ? (
                      <div className="mt-3 grid gap-2">
                        {assigned.map((task) => (
                          <div key={task.id} className="rounded-md border border-line bg-mist/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                  <Clapperboard className="h-4 w-4 text-zinc-500" />
                                  {task.events?.event_name ?? task.clients?.host_name ?? task.task_type}
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

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-lg font-semibold text-ink">{editing?.id ? "Edit" : "Add"} Team Member</h3>
              <button aria-label="Close" title="Close" onClick={() => setOpen(false)} className="rounded-md p-2 text-zinc-500 hover:bg-mist">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={saveRecord.bind(null, "editors")} className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              {fields.map((field) => {
                const value = editing?.[field.name] ?? "";
                const common = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";
                return (
                  <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <span className="text-sm font-medium text-zinc-700">{field.label}{field.required ? " *" : ""}</span>
                    {field.type === "textarea" ? (
                      <textarea name={field.name} defaultValue={value} rows={4} className={common} placeholder={field.placeholder} />
                    ) : field.type === "select" ? (
                      <select name={field.name} defaultValue={value} required={field.required} className={common}>
                        <option value="">Select</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input name={field.name} defaultValue={value} required={field.required} type={field.type} step={field.type === "number" ? "0.01" : undefined} className={common} placeholder={field.placeholder} />
                    )}
                  </label>
                );
              })}
              <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-mist">
                  Cancel
                </button>
                <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#176274]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
