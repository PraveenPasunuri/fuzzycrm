import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Scissors, Truck, Users } from "lucide-react";
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
    supabase.from("editing_tasks").select("id,photo_editor_id,video_editor_id,status"),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).neq("status", "Delivered"),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("status", "Delivered")
  ]);

  const unassignedEditing = ((editingTasks.data ?? []) as Record<string, any>[]).filter((task) => {
    return task.status === "Not Assigned" || !task.photo_editor_id || !task.video_editor_id;
  }).length;

  const tiles = [
    {
      label: "Total Clients",
      value: clients.count ?? 0,
      icon: Users,
      href: "/clients",
      helper: "Worked till date and confirmed future clients",
      accent: "text-brand bg-brand-soft"
    },
    {
      label: "Pending Clients",
      value: pendingClients.count ?? 0,
      icon: Clock3,
      href: "/clients?group=pending",
      helper: "Quotation pending or waiting for event date",
      accent: "text-amber-600 bg-amber-50"
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents.count ?? 0,
      icon: CalendarDays,
      href: "/events",
      helper: `Events remaining in ${year}`,
      accent: "text-sky-600 bg-sky-50"
    },
    {
      label: "Unassigned Editing",
      value: unassignedEditing,
      icon: Scissors,
      href: "/editing-tasks",
      helper: "Photo or video editing not assigned",
      accent: "text-rose-600 bg-rose-50"
    },
    {
      label: "Pending Delivery",
      value: pendingDeliverables.count ?? 0,
      icon: Truck,
      href: "/deliverables?filter=Pending",
      helper: "Deliverables pending to client",
      accent: "text-violet-600 bg-violet-50"
    },
    {
      label: "Delivered",
      value: deliveredDeliverables.count ?? 0,
      icon: CheckCircle2,
      href: "/deliverables?filter=Delivered",
      helper: "Work delivered to client",
      accent: "text-emerald-600 bg-emerald-50"
    }
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">A snapshot of clients, events, editing, and delivery across your studio.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tile.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand" />
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-ink">{tile.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{tile.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{tile.helper}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Quick links</h2>
        <p className="mt-1 text-xs text-muted">Jump into a board to manage your workflow Trello-style.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: "/events", label: "Events board" },
            { href: "/deliverables", label: "Deliverables board" },
            { href: "/editing-tasks", label: "Editing board" },
            { href: "/clients", label: "Clients" },
            { href: "/editors", label: "Team" }
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
