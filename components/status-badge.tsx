import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  Booked: "bg-sky-50 text-sky-700 ring-sky-200",
  "Shoot Completed": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Editing: "bg-amber-50 text-amber-700 ring-amber-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
  "Not Paid": "bg-rose-50 text-rose-700 ring-rose-200",
  "Advance Paid": "bg-orange-50 text-orange-700 ring-orange-200",
  "Partially Paid": "bg-yellow-50 text-yellow-700 ring-yellow-200",
  "Fully Paid": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Assigned: "bg-sky-50 text-sky-700 ring-sky-200",
  "Not Assigned": "bg-zinc-100 text-zinc-700 ring-zinc-200",
  "Sent For Review": "bg-violet-50 text-violet-700 ring-violet-200",
  "Changes Requested": "bg-red-50 text-red-700 ring-red-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1", tones[value] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200")}>
      {value}
    </span>
  );
}
