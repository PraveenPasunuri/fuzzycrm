import { cn } from "@/lib/utils";

type Tone = { badge: string; dot: string };

const tones: Record<string, Tone> = {
  Booked: { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  Inquiry: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  Confirmed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  "Shoot Completed": { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  Editing: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  Delivered: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Closed: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  Pending: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  "Waiting For Event Date": { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  Cancelled: { badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  "In Progress": { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  "Not Paid": { badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  "Advance Paid": { badge: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  "Partially Paid": { badge: "bg-yellow-50 text-yellow-700 ring-yellow-200", dot: "bg-yellow-500" },
  "Fully Paid": { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Assigned: { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  "Not Assigned": { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  "Submitted For Editing": { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  "Sent For Review": { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  "Changes Requested": { badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  // Data Management pipeline labels
  "Awaiting Data": { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  "Receiving Data": { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  Cataloging: { badge: "bg-cyan-50 text-cyan-700 ring-cyan-200", dot: "bg-cyan-500" },
  "Editing Complete": { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" }
};

const fallback: Tone = { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" };

export function StatusBadge({ value }: { value: string }) {
  const tone = tones[value] ?? fallback;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tone.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {value}
    </span>
  );
}
