import { Inbox } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-mist">
        <Inbox className="h-7 w-7 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
    </div>
  );
}
