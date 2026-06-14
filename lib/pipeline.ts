// Data Management pipeline definition.
//
// An event enters Data Management once it is "Shoot Completed" (or further along).
// Each event runs two parallel tracks - Photo and Video - followed by a shared
// delivery tail (Delivered -> Changes Requested -> Closed). Stage completion is
// derived from boolean / link / editor columns on the `events` row.

export type EventRow = Record<string, any>;

export type StageKind = "toggle" | "link" | "editor" | "done";

export type StageDef = {
  /** Stable id used by the update action. */
  key: string;
  /** Short label shown under the dot on the tracking bar. */
  label: string;
  /** The events column this stage reads/writes. */
  field: string;
  /** How the stage is edited inline. */
  kind: StageKind;
  /** Tailwind color used when the stage is complete. */
  color: string;
};

export type TrackDef = {
  id: "photo" | "video" | "shared";
  title: string;
  stages: StageDef[];
};

export const tracks: TrackDef[] = [
  {
    id: "photo",
    title: "Photo",
    stages: [
      { key: "photo_data_received", label: "Data received", field: "photo_data_received", kind: "toggle", color: "bg-sky-500" },
      { key: "photo_catalog_link", label: "Catalog", field: "photo_catalog_link", kind: "link", color: "bg-cyan-500" },
      { key: "photo_editor_id", label: "Editor assigned", field: "photo_editor_id", kind: "editor", color: "bg-indigo-500" },
      { key: "photo_editing_completed", label: "Editing done", field: "photo_editing_completed", kind: "toggle", color: "bg-violet-500" }
    ]
  },
  {
    id: "video",
    title: "Video",
    stages: [
      { key: "video_data_received", label: "Data received", field: "video_data_received", kind: "toggle", color: "bg-sky-500" },
      { key: "video_catalog_link", label: "Catalog", field: "video_catalog_link", kind: "link", color: "bg-cyan-500" },
      { key: "video_editor_id", label: "Editor assigned", field: "video_editor_id", kind: "editor", color: "bg-indigo-500" },
      { key: "video_editing_completed", label: "Editing done", field: "video_editing_completed", kind: "toggle", color: "bg-violet-500" }
    ]
  },
  {
    id: "shared",
    title: "Delivery",
    stages: [
      { key: "delivered_to_client", label: "Delivered", field: "delivered_to_client", kind: "toggle", color: "bg-emerald-500" },
      { key: "changes_requested", label: "Changes", field: "changes_requested", kind: "toggle", color: "bg-amber-500" },
      { key: "pipeline_closed", label: "Closed", field: "pipeline_closed", kind: "done", color: "bg-slate-600" }
    ]
  }
];

/** Every tracking column on the events row. */
export const trackingFields = tracks.flatMap((track) => track.stages.map((stage) => stage.field));

/** A stage counts as complete when its underlying field is truthy / non-empty. */
export function isStageComplete(event: EventRow, stage: StageDef) {
  const value = event[stage.field];
  if (stage.kind === "link") return Boolean(String(value ?? "").trim());
  if (stage.kind === "editor") return Boolean(value);
  return Boolean(value);
}

/** Count of completed stages across all tracks, for a single 0-100 progress number. */
export function overallProgress(event: EventRow) {
  const all = tracks.flatMap((track) => track.stages);
  const done = all.filter((stage) => isStageComplete(event, stage)).length;
  return Math.round((done / all.length) * 100);
}

/** Per-track completed / total counts. */
export function trackProgress(event: EventRow, track: TrackDef) {
  const done = track.stages.filter((stage) => isStageComplete(event, stage)).length;
  return { done, total: track.stages.length };
}

/**
 * A short human label for the event's current position in the pipeline,
 * used as the headline status pill on the tile.
 */
export function pipelineStageLabel(event: EventRow) {
  if (event.pipeline_closed) return "Closed";
  if (event.changes_requested) return "Changes Requested";
  if (event.delivered_to_client) return "Delivered";
  const photoDone = event.photo_editing_completed;
  const videoDone = event.video_editing_completed;
  if (photoDone && videoDone) return "Editing Complete";
  if (event.photo_editor_id || event.video_editor_id) return "Editing";
  if (event.photo_catalog_link || event.video_catalog_link) return "Cataloging";
  if (event.photo_data_received || event.video_data_received) return "Receiving Data";
  return "Awaiting Data";
}

/** Statuses that put an event into the Data Management pipeline. */
export const pipelineStatuses = ["Shoot Completed", "Editing", "Delivered", "Closed"];
