import { AlertCircle, CalendarDays, CreditCard, Scissors, Truck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { currency, prettyDate, todayIso } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayIso();

  const [
    clients,
    upcomingEvents,
    pendingPayments,
    editingTasks,
    pendingDeliverables,
    recentEvents,
    overduePayments,
    overdueDeliverables
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("event_date", today).neq("status", "Closed"),
    supabase.from("payments").select("balance_amount", { count: "exact" }).neq("payment_status", "Fully Paid"),
    supabase.from("editing_tasks").select("id", { count: "exact", head: true }).in("status", ["Assigned", "In Progress", "Sent For Review", "Changes Requested"]),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).neq("status", "Delivered"),
    supabase.from("events").select("id,event_name,event_date,status,clients:client_id(name)").order("event_date", { ascending: false }).limit(5),
    supabase.from("payments").select("id,payment_due_date,balance_amount,payment_status,events:event_id(event_name)").lt("payment_due_date", today).neq("payment_status", "Fully Paid").limit(5),
    supabase.from("deliverables").select("id,due_date,deliverable_type,status,events:event_id(event_name)").lt("due_date", today).neq("status", "Delivered").limit(5)
  ]);

  const pendingBalance = (pendingPayments.data ?? []).reduce((sum, payment) => sum + Number(payment.balance_amount ?? 0), 0);

  const cards = [
    { label: "Total clients", value: clients.count ?? 0, icon: Users },
    { label: "Upcoming events", value: upcomingEvents.count ?? 0, icon: CalendarDays },
    { label: "Pending payments", value: currency(pendingBalance), icon: CreditCard },
    { label: "Editing in progress", value: editingTasks.count ?? 0, icon: Scissors },
    { label: "Deliverables pending", value: pendingDeliverables.count ?? 0, icon: Truck }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">Today&apos;s operational snapshot across shoots, edits, payments, and delivery.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-line bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <p className="mt-3 text-2xl font-bold text-ink">{card.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-semibold text-ink">Recent Events</h3>
          </div>
          <div className="divide-y divide-line">
            {(recentEvents.data ?? []).length === 0 ? (
              <div className="p-5"><EmptyState title="No recent events" text="Create events to see them summarized here." /></div>
            ) : (
              recentEvents.data?.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-ink">{event.event_name}</p>
                    <p className="text-sm text-zinc-500">{(event.clients as any)?.name ?? "No client"} · {prettyDate(event.event_date)}</p>
                  </div>
                  <StatusBadge value={event.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <AlertCircle className="h-5 w-5 text-coral" />
            <h3 className="font-semibold text-ink">Overdue Items</h3>
          </div>
          <div className="divide-y divide-line">
            {[...(overduePayments.data ?? []), ...(overdueDeliverables.data ?? [])].length === 0 ? (
              <div className="p-5"><EmptyState title="Nothing overdue" text="Payment and deliverable due dates are currently clear." /></div>
            ) : (
              <>
                {overduePayments.data?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-medium text-ink">{(payment.events as any)?.event_name ?? "Payment"}</p>
                      <p className="text-sm text-zinc-500">Balance {currency(payment.balance_amount)} due {prettyDate(payment.payment_due_date)}</p>
                    </div>
                    <StatusBadge value={payment.payment_status} />
                  </div>
                ))}
                {overdueDeliverables.data?.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-medium text-ink">{deliverable.deliverable_type}</p>
                      <p className="text-sm text-zinc-500">{(deliverable.events as any)?.event_name ?? "Deliverable"} due {prettyDate(deliverable.due_date)}</p>
                    </div>
                    <StatusBadge value={deliverable.status} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
