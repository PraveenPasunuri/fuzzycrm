import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Scissors, Truck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayIso();
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [clients, pendingClients, upcomingEvents, editingTasks, pendingDeliverables, deliveredDeliverables] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).in("status", ["Inquiry", "Pending", "Waiting For Event Date"]),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("event_date", today).gte("event_date", yearStart).lte("event_date", yearEnd),
    supabase.from("editing_tasks").select("id,photo_editor_assigned,video_editor_assigned,status"),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).neq("status", "Delivered"),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("status", "Delivered")
  ]);

  const unassignedEditing = (editingTasks.data ?? []).filter((task) => {
    return task.status === "Not Assigned" || !task.photo_editor_assigned || !task.video_editor_assigned;
  }).length;

  const tiles = [
    {
      label: "Total Clients",
      value: clients.count ?? 0,
      icon: Users,
      href: "/clients",
      helper: "Worked till date and confirmed future clients"
    },
    {
      label: "Pending Clients",
      value: pendingClients.count ?? 0,
      icon: Clock3,
      href: "/clients?group=pending",
      helper: "Quotation pending or waiting for event date"
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents.count ?? 0,
      icon: CalendarDays,
      href: "/events",
      helper: `Events remaining in ${year}`
    },
    {
      label: "Unassigned Editing",
      value: unassignedEditing,
      icon: Scissors,
      href: "/events?assignment=unassigned",
      helper: "Photo or video editing not assigned"
    },
    {
      label: "Pending",
      value: pendingDeliverables.count ?? 0,
      icon: Truck,
      href: "/deliverables?filter=Pending",
      helper: "Deliverables pending to client"
    },
    {
      label: "Delivered",
      value: deliveredDeliverables.count ?? 0,
      icon: CheckCircle2,
      href: "/deliverables?filter=Delivered",
      helper: "Work delivered to client"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">High-level counts for clients, events, editing, and delivery.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.label} href={tile.href} className="rounded-lg border border-line bg-white p-5 shadow-soft transition hover:border-brand hover:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{tile.label}</p>
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <p className="mt-4 text-4xl font-bold text-ink">{tile.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{tile.helper}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
