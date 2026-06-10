import { Inbox } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center">
      <Inbox className="h-9 w-9 text-zinc-400" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{text}</p>
    </div>
  );
}
