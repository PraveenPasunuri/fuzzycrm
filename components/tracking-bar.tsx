"use client";

import { Check, ExternalLink } from "lucide-react";
import { isStageComplete, trackProgress, type EventRow, type StageDef, type TrackDef } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

type Props = {
  track: TrackDef;
  event: EventRow;
  activeStage: string | null;
  onSelectStage: (stageKey: string | null) => void;
  disabled?: boolean;
};

/**
 * Domino's-style progress tracker for a single pipeline track.
 * Connected, color-filled dots; the active dot is highlighted; completed
 * segments are colored, pending segments are grey. Clicking a dot asks the
 * parent to open that stage's inline editor.
 */
export function TrackingBar({ track, event, activeStage, onSelectStage, disabled }: Props) {
  const { done, total } = trackProgress(event, track);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{track.title}</span>
        <span className="text-[11px] font-semibold text-slate-500">
          {done}/{total}
        </span>
      </div>

      <div className="flex items-stretch">
        {track.stages.map((stage, index) => {
          const complete = isStageComplete(event, stage);
          const isActive = activeStage === stage.key;
          const prevComplete = index > 0 ? isStageComplete(event, track.stages[index - 1]) : true;
          return (
            <div key={stage.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* left connector */}
                <span
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    index === 0 ? "opacity-0" : prevComplete && complete ? stage.color : "bg-slate-200"
                  )}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectStage(isActive ? null : stage.key)}
                  title={stage.label}
                  aria-label={stage.label}
                  className={cn(
                    "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-card transition",
                    complete ? stage.color : "bg-slate-200 text-slate-500",
                    isActive && "ring-2 ring-offset-2 ring-brand",
                    !disabled && "hover:scale-110"
                  )}
                >
                  {complete ? <Check className="h-3.5 w-3.5" /> : <span className="text-[11px] font-bold">{index + 1}</span>}
                </button>
                {/* right connector */}
                <span
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    index === track.stages.length - 1
                      ? "opacity-0"
                      : complete && isStageComplete(event, track.stages[index + 1])
                        ? track.stages[index + 1].color
                        : "bg-slate-200"
                  )}
                />
              </div>
              <span className={cn("mt-1.5 text-center text-[10px] leading-tight", complete ? "font-semibold text-ink" : "text-muted")}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StageValue({ event, stage, editorName }: { event: EventRow; stage: StageDef; editorName?: string }) {
  if (stage.kind === "link") {
    const link = String(event[stage.field] ?? "").trim();
    if (!link) return null;
    return (
      <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        Open catalog <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (stage.kind === "editor" && event[stage.field]) {
    return <span className="text-xs font-medium text-slate-600">{editorName ?? "Assigned"}</span>;
  }
  return null;
}
