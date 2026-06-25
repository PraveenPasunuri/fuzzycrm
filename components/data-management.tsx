"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Search, UserRound, Video, X, DollarSign } from "lucide-react";
import { updateEventTracking } from "@/lib/actions";
import {
  tracks,
  type EventRow,
  type StageDef,
  type TrackDef
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

type Editor = { id: string; name: string; role?: string };
type TrackFieldMap = {
  editorField: string;
  catalogField: string;
  dataUploadedField: string;
  paymentField: string;
};

type Props = {
  events: EventRow[];
  editors: Editor[];
};

// Map track IDs to editor/catalog/payment field names
const trackFieldMap: Record<string, TrackFieldMap> = {
  photo: {
    editorField: "photo_editor_id",
    catalogField: "photo_catalog_link",
    dataUploadedField: "photo_data_uploaded",
    paymentField: "photo_editor_payment"
  },
  video: {
    editorField: "video_editor_id",
    catalogField: "video_catalog_link",
    dataUploadedField: "video_data_uploaded",
    paymentField: "video_editor_payment"
  },
  video_traditional: {
    editorField: "video_traditional_editor_id",
    catalogField: "video_traditional_catalog_link",
    dataUploadedField: "video_traditional_data_uploaded",
    paymentField: "video_traditional_editor_payment"
  }
};

function isStageComplete(event: EventRow, stage: StageDef, trackId: string) {
  const field = stage.field;
  const value = event[field];
  if (stage.kind === "link") return Boolean(String(value ?? "").trim());
  if (stage.kind === "editor") return Boolean(value);
  return Boolean(value);
}

export function DataManagement({ events, editors }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeStage, setActiveStage] = useState<{ eventId: string; stageKey: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const editorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const editor of editors) map.set(editor.id, editor.name);
    return map;
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Data Management</h1>
        <p className="mt-1 text-sm text-muted">
          Track photo, video, and traditional video through data, cataloging, editing, and delivery.
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
        <div className="space-y-8">
          {/* Kanban board for each track */}
          {tracks
            .filter((track) => track.id !== "shared")
            .map((track) => (
              <KanbanTrack
                key={track.id}
                track={track}
                events={visible}
                editors={editors}
                editorNameMap={editorNameMap}
                trackFieldMap={trackFieldMap[track.id]}
                activeStage={activeStage}
                onSelectStage={setActiveStage}
                disabled={isPending}
                onCommit={commit}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function KanbanTrack({
  track,
  events,
  editors,
  editorNameMap,
  trackFieldMap,
  activeStage,
  onSelectStage,
  disabled,
  onCommit
}: {
  track: TrackDef;
  events: EventRow[];
  editors: Editor[];
  editorNameMap: Map<string, string>;
  trackFieldMap: TrackFieldMap;
  activeStage: { eventId: string; stageKey: string } | null;
  onSelectStage: (stage: { eventId: string; stageKey: string } | null) => void;
  disabled: boolean;
  onCommit: (eventId: string, field: string, value: string | boolean | null) => void;
}) {
  const trackIcon = track.id === "photo" ? Camera : Video;
  const Icon = trackIcon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-bold text-ink">{track.title}</h2>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {track.stages.map((stage) => {
          // Find all events that are at or past this stage
          const cardsInColumn = events.filter((event) => {
            // Check if this event has completed all previous stages and is at this stage
            const stageIndex = track.stages.indexOf(stage);
            const allPreviousComplete = track.stages
              .slice(0, stageIndex)
              .every((s) => isStageComplete(event, s, track.id));

            if (!allPreviousComplete) return false;

            // If all previous are complete, check if this stage is complete
            return isStageComplete(event, stage, track.id);
          });

          return (
            <div key={stage.key} className="flex w-80 shrink-0 flex-col rounded-xl border border-line bg-canvas">
              {/* Column header */}
              <div className={cn("border-b border-line px-4 py-3", stage.color)}>
                <h3 className="text-sm font-semibold text-white">{stage.label}</h3>
                <p className="text-xs font-medium text-white/80">{cardsInColumn.length} items</p>
              </div>

              {/* Column cards */}
              <div className="flex-1 space-y-2 p-3">
                {cardsInColumn.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-muted">
                    No items
                  </div>
                ) : (
                  cardsInColumn.map((event) => {
                    const assignedEditor = editorNameMap.get(event[trackFieldMap.editorField] as string);
                    const payment = event[trackFieldMap.paymentField as keyof EventRow];
                    const isActive = activeStage?.eventId === event.id && activeStage?.stageKey === stage.key;

                    return (
                      <div
                        key={event.id}
                        className="rounded-lg border border-line bg-white p-3 shadow-sm transition hover:shadow-card"
                      >
                        <p className="truncate text-sm font-semibold text-ink">{event.clients?.host_name}</p>
                        <p className="truncate text-xs text-slate-600">{event.event_name || event.event_type}</p>

                        <div className="mt-2 space-y-1 border-t border-line pt-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Assignee:</span>
                            <span className="font-medium">{assignedEditor || "Unassigned"}</span>
                          </div>
                          {payment ? (
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1 text-slate-600">
                                <DollarSign className="h-3 w-3" />
                                Payment:
                              </span>
                              <span className="font-medium">${Number(payment).toFixed(2)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 flex gap-2">
                          {stage.kind === "editor" && (
                            <button
                              onClick={() => onSelectStage({ eventId: event.id, stageKey: stage.key })}
                              className="flex-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:bg-brand-dark"
                            >
                              Assign
                            </button>
                          )}
                          {stage.kind === "link" && (
                            <button
                              onClick={() => onSelectStage({ eventId: event.id, stageKey: stage.key })}
                              className="flex-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:bg-brand-dark"
                            >
                              Add Link
                            </button>
                          )}
                          {(stage.kind === "toggle" || stage.kind === "done") && (
                            <button
                              onClick={() => onCommit(event.id, stage.field, !event[stage.field])}
                              disabled={disabled}
                              className="flex-1 rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
                            >
                              Done
                            </button>
                          )}
                        </div>

                        {/* Inline editor for active stage */}
                        {isActive && (
                          <StageInlineEditor
                            stage={stage}
                            event={event}
                            editors={editors}
                            disabled={disabled}
                            onClose={() => onSelectStage(null)}
                            onSave={(field, value) => {
                              onCommit(event.id, field, value);
                              onSelectStage(null);
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageInlineEditor({
  stage,
  event,
  editors,
  disabled,
  onClose,
  onSave
}: {
  stage: StageDef;
  event: EventRow;
  editors: Editor[];
  disabled: boolean;
  onClose: () => void;
  onSave: (field: string, value: string | boolean | null) => void;
}) {
  const [linkValue, setLinkValue] = useState(String(event[stage.field] ?? ""));
  const [editorValue, setEditorValue] = useState(String(event[stage.field] ?? ""));

  return (
    <div className="mt-3 border-t border-line pt-3">
      {stage.kind === "link" ? (
        <div className="flex flex-col gap-2">
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Paste link..."
            className="h-8 rounded-lg border border-line bg-white px-2 text-xs outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onSave(stage.field, linkValue)}
              disabled={disabled}
              className="flex-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-canvas"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : stage.kind === "editor" ? (
        <div className="flex flex-col gap-2">
          <select
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            className="h-8 rounded-lg border border-line bg-white px-2 text-xs outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
          >
            <option value="">Unassigned</option>
            {editors.map((editor) => (
              <option key={editor.id} value={editor.id}>
                {editor.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(stage.field, editorValue || null)}
              disabled={disabled}
              className="flex-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              Assign
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-canvas"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
