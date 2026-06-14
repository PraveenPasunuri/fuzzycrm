"use client";

import { useState } from "react";
import { Edit, GripVertical, Trash2 } from "lucide-react";
import { type ModuleConfig } from "@/lib/module-config";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type Props = {
  config: ModuleConfig;
  rows: Record<string, any>[];
  onEdit: (row: Record<string, any>) => void;
  onDelete: (row: Record<string, any>) => void;
  onMove: (row: Record<string, any>, status: string) => void;
  disabled?: boolean;
};

const columnAccent: Record<string, string> = {
  Booked: "bg-sky-400",
  "Shoot Completed": "bg-indigo-400",
  Editing: "bg-amber-400",
  Delivered: "bg-emerald-400",
  Closed: "bg-slate-400",
  Pending: "bg-amber-400",
  "In Progress": "bg-blue-400",
  "Not Assigned": "bg-slate-400",
  Assigned: "bg-sky-400",
  "Submitted For Editing": "bg-indigo-400",
  "Sent For Review": "bg-violet-400",
  "Changes Requested": "bg-rose-400",
  Completed: "bg-emerald-400"
};

function getValue(row: Record<string, any>, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object") return (value as Record<string, unknown>)[part];
    return undefined;
  }, row);
}

function cardTitle(config: ModuleConfig, row: Record<string, any>) {
  if (config.slug === "events") return row.clients?.host_name || row.event_name || "Event";
  if (config.slug === "deliverables") return row.events?.event_name || row.deliverable_type || "Deliverable";
  if (config.slug === "editing-tasks") return row.clients?.host_name || row.task_type || "Task";
  return String(getValue(row, config.displayField) ?? "Untitled");
}

function cardSubtitle(config: ModuleConfig, row: Record<string, any>) {
  if (config.slug === "events") return row.event_name || row.event_type || "";
  if (config.slug === "deliverables") return row.deliverable_type || "";
  if (config.slug === "editing-tasks") return row.task_type || "";
  return "";
}

function cardMeta(config: ModuleConfig, row: Record<string, any>): { label: string; value: string }[] {
  const meta: { label: string; value: string }[] = [];
  const push = (label: string, value: unknown) => {
    const v = value == null || value === "" ? "" : String(value);
    if (v) meta.push({ label, value: v });
  };
  if (config.slug === "events") {
    push("Photo", row.photo_shooter?.name ?? "Unassigned");
    push("Video", row.video_shooter?.name ?? "Unassigned");
    push("Hours", row.total_hours);
  } else if (config.slug === "deliverables") {
    push("Due", row.due_date);
  } else if (config.slug === "editing-tasks") {
    push("Photo editor", row.photo_editor?.name ?? "Unassigned");
    push("Video editor", row.video_editor?.name ?? "Unassigned");
  }
  return meta;
}

export function KanbanBoard({ config, rows, onEdit, onDelete, onMove, disabled }: Props) {
  const statusField = config.statusField ?? "status";
  const columns = config.boardColumns ?? [];
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const grouped = new Map<string, Record<string, any>[]>();
  for (const col of columns) grouped.set(col, []);
  const overflow: Record<string, any>[] = [];
  for (const row of rows) {
    const status = String(row[statusField] ?? "");
    if (grouped.has(status)) grouped.get(status)!.push(row);
    else overflow.push(row);
  }

  function handleDrop(status: string) {
    setOverColumn(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const row = rows.find((r) => String(r.id) === id);
    if (!row || String(row[statusField]) === status) return;
    onMove(row, status);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = grouped.get(status) ?? [];
        const isOver = overColumn === status;
        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              if (overColumn !== status) setOverColumn(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setOverColumn((c) => (c === status ? null : c));
            }}
            onDrop={() => handleDrop(status)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-2xl border border-line bg-mist/70 transition",
              isOver && "border-brand/50 bg-brand-soft/60 ring-2 ring-brand/20"
            )}
          >
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", columnAccent[status] ?? "bg-slate-400")} />
                <h3 className="text-sm font-semibold text-ink">{status}</h3>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted shadow-card">{items.length}</span>
            </div>

            <div className="flex-1 space-y-2.5 px-2.5 pb-3">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-muted">
                  {isOver ? "Drop here" : "No cards"}
                </div>
              ) : (
                items.map((row) => {
                  const isDragging = draggingId === String(row.id);
                  const meta = cardMeta(config, row);
                  const subtitle = cardSubtitle(config, row);
                  return (
                    <article
                      key={row.id}
                      draggable={!disabled}
                      onDragStart={() => setDraggingId(String(row.id))}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverColumn(null);
                      }}
                      className={cn(
                        "group cursor-grab rounded-xl border border-line bg-white p-3 shadow-card transition hover:shadow-soft active:cursor-grabbing",
                        isDragging && "opacity-40 ring-2 ring-brand"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{cardTitle(config, row)}</p>
                          {subtitle ? <p className="mt-0.5 truncate text-xs font-medium text-brand">{subtitle}</p> : null}
                        </div>
                      </div>

                      {meta.length ? (
                        <dl className="mt-2.5 space-y-1 pl-6">
                          {meta.map((m) => (
                            <div key={m.label} className="flex items-center gap-1.5 text-xs">
                              <dt className="text-muted">{m.label}:</dt>
                              <dd className="truncate font-medium text-slate-700">{m.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}

                      <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-line pt-2.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Edit"
                          title="Edit"
                          onClick={() => onEdit(row)}
                          className="rounded-lg border border-line bg-white p-1.5 text-slate-600 hover:bg-mist"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          title="Delete"
                          disabled={disabled}
                          onClick={() => onDelete(row)}
                          className="rounded-lg border border-line bg-white p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {overflow.length ? (
        <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-line bg-mist/70">
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <h3 className="text-sm font-semibold text-ink">Other</h3>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted shadow-card">{overflow.length}</span>
          </div>
          <div className="flex-1 space-y-2.5 px-2.5 pb-3">
            {overflow.map((row) => (
              <article key={row.id} className="rounded-xl border border-line bg-white p-3 shadow-card">
                <p className="truncate text-sm font-semibold text-ink">{cardTitle(config, row)}</p>
                <div className="mt-2">
                  <StatusBadge value={String(row[statusField] ?? "Unknown")} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-1.5">
                  <button onClick={() => onEdit(row)} className="rounded-lg border border-line bg-white p-1.5 text-slate-600 hover:bg-mist" aria-label="Edit" title="Edit">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onDelete(row)} disabled={disabled} className="rounded-lg border border-line bg-white p-1.5 text-rose-600 hover:bg-rose-50" aria-label="Delete" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
