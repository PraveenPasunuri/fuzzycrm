import { BarChart3, CheckCircle2, CreditCard, Scissors, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { currency } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [monthlyClients, pendingClients, editorPayments, completedEvents, pendingDeliverables] = await Promise.all([
    supabase.from("clients").select("advance_paid,total_price").gte("updated_at", monthStart).lt("updated_at", nextMonthStart),
    supabase.from("clients").select("balance_due").gt("balance_due", 0),
    supabase.from("editing_tasks").select("editor_payment,status").neq("status", "Completed"),
    supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["Delivered", "Closed"]),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).neq("status", "Delivered")
  ]);

  const monthlyRows = (monthlyClients.data ?? []) as Record<string, any>[];
  const pendingRows = (pendingClients.data ?? []) as Record<string, any>[];
  const editorRows = (editorPayments.data ?? []) as Record<string, any>[];

  const monthlyRevenue = monthlyRows.reduce((sum, client) => {
    const advance = Number(client.advance_paid ?? 0);
    return sum + (advance > 0 ? advance : Number(client.total_price ?? 0));
  }, 0);
  const pendingBalance = pendingRows.reduce((sum, client) => sum + Number(client.balance_due ?? 0), 0);
  const editorDue = editorRows.reduce((sum, task) => sum + Number(task.editor_payment ?? 0), 0);

  const reports = [
    { label: "Monthly revenue", value: currency(monthlyRevenue), icon: BarChart3 },
    { label: "Pending balance", value: currency(pendingBalance), icon: CreditCard },
    { label: "Editor payments due", value: currency(editorDue), icon: Scissors },
    { label: "Completed events", value: completedEvents.count ?? 0, icon: CheckCircle2 },
    { label: "Pending deliverables", value: pendingDeliverables.count ?? 0, icon: Truck }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reports</h1>
        <p className="mt-1 text-sm text-muted">Quick financial and fulfillment totals for the business.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.label} className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted">{report.label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-ink">{report.value}</p>
            </div>
          );
        })}
      </section>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <h3 className="font-semibold text-ink">Report notes</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Monthly revenue is calculated from client records updated during the current month. Pending balance comes from client balance due values, and editor payments due are taken from open editing assignments.
        </p>
      </div>
    </div>
  );
}
