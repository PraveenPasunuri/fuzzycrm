"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Camera, MapPin, Search, UserRound, Video, X } from "lucide-react";
import { updateEventTracking } from "@/lib/actions";
import {
  overallProgress,
  pipelineStageLabel,
  tracks,
  type EventRow,
  type StageDef
} from "@/lib/pipeline";
import { cn, prettyDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { StageValue, TrackingBar } from "@/components/tracking-bar";

type Editor = { id: string; name: string; role?: string };

type Props = {
  events: EventRow[];
  editors: Editor[];
};

const stageByKey = new Map<string, StageDef>(tracks.flatMap((track) => track.stages).map((stage) => [stage.key, stage]));

export function DataManagement({ events, editors }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<{ eventId: string; stageKey: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const editorName = useMemo(() => {
    const map = new Map<string, string>();
    for (const editor of editors) map.set(editor.id, editor.name);
    return (id: string | null | undefined) => (id ? map.get(id) ?? "Assigned" : undefined);
  }, [editors]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) =>
      [event.clients?.host_name, event.event_name, event.event_type, event.location]
        .some((value) => String(value ?? "").toLowerCase().includes(normalized))
    );
  }, [events, query]);

  function commit(eventId: string, field: string, value: string | boolean | null) {
    startTransition(async () => {
      await updateEventTracking(eventId, field, value);
      router.refresh();
    });
  }

  function toggleStage(event: EventRow, stage: StageDef) {
    commit(event.id, stage.field, !event[stage.field]);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Data Management</h1>
        <p className="mt-1 text-sm text-muted">
          Track each shoot-completed event through data, cataloging, editing, and delivery.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-3 shadow-card">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by client, event, or location..."
            className="h-10 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No events in the pipeline"
          text="Events appear here once they are marked Shoot Completed on the Events board."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((event) => {
            const progress = overallProgress(event);
            const host = event.clients?.host_name ?? "No host";
            return (
              <article key={event.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:shadow-soft">
                {/* overall progress strip */}
                <div className="h-1.5 w-full bg-slate-100">
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-ink">{host}</h3>
                      <p className="mt-0.5 truncate text-sm font-semibold text-brand">{event.event_name ?? event.event_type ?? "Event"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{prettyDate(event.event_date)}</span>
                        {event.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={pipelineStageLabel(event)} />
                      <span className="text-xs font-bold text-slate-500">{progress}%</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    {tracks.map((track) => {
                      const activeForCard = active && active.eventId === event.id ? active.stageKey : null;
                      const editStage =
                        activeForCard && track.stages.some((stage) => stage.key === activeForCard)
                          ? stageByKey.get(activeForCard)
                          : null;
                      return (
                        <div key={track.id}>
                          <TrackingBar
                            track={track}
                            event={event}
                            activeStage={activeForCard}
                            onSelectStage={(stageKey) =>
                              setActive(stageKey ? { eventId: event.id, stageKey } : null)
                            }
                            disabled={isPending}
                          />
                          {editStage ? (
                            <StageEditor
                              event={event}
                              stage={editStage}
                              editors={editors}
                              disabled={isPending}
                              onClose={() => setActive(null)}
                              onToggle={(stage) => toggleStage(event, stage)}
                              onSave={(field, value) => {
                                commit(event.id, field, value);
                                setActive(null);
                              }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* quick reference of saved links / editors */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
                    <TrackSummary icon={Camera} label="Photo" event={event} editorField="photo_editor_id" catalogField="photo_catalog_link" editorName={editorName} />
                    <TrackSummary icon={Video} label="Video" event={event} editorField="video_editor_id" catalogField="video_catalog_link" editorName={editorName} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackSummary({
  icon: Icon,
  label,
  event,
  editorField,
  catalogField,
  editorName
}: {
  icon: typeof Camera;
  label: string;
  event: EventRow;
  editorField: string;
  catalogField: string;
  editorName: (id: string | null | undefined) => string | undefined;
}) {
  const catalog = String(event[catalogField] ?? "").trim();
  const editor = editorName(event[editorField]);
  return (
    <div className="rounded-lg bg-canvas px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 truncate text-xs text-muted">
        Editor: <span className="font-medium text-slate-700">{editor ?? "Unassigned"}</span>
      </p>
      <p className="truncate text-xs text-muted">
        Catalog:{" "}
        {catalog ? (
          <a href={catalog} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
            View
          </a>
        ) : (
          <span className="font-medium text-slate-700">None</span>
        )}
      </p>
    </div>
  );
}

function StageEditor({
  event,
  stage,
  editors,
  disabled,
  onClose,
  onToggle,
  onSave
}: {
  event: EventRow;
  stage: StageDef;
  editors: Editor[];
  disabled?: boolean;
  onClose: () => void;
  onToggle: (stage: StageDef) => void;
  onSave: (field: string, value: string | boolean | null) => void;
}) {
  const [linkValue, setLinkValue] = useState(String(event[stage.field] ?? ""));
  const [editorValue, setEditorValue] = useState(String(event[stage.field] ?? ""));

  return (
    <div className="mt-3 animate-fade-in rounded-xl border border-line bg-canvas p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">{stage.label}</p>
        <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-mist hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      {stage.kind === "toggle" || stage.kind === "done" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggle(stage)}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-sm font-semibold transition",
            event[stage.field]
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-brand text-white shadow-soft hover:bg-brand-dark"
          )}
        >
          {event[stage.field] ? "Mark as not done" : "Mark as done"}
        </button>
      ) : null}

      {stage.kind === "link" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Paste catalog link or location..."
            className="h-9 flex-1 rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSave(stage.field, linkValue)}
            className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Save
          </button>
        </div>
      ) : null}

      {stage.kind === "editor" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Unassigned</option>
              {editors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.name}
                  {editor.role ? ` · ${editor.role}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSave(stage.field, editorValue || null)}
            className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
}
