import { BarChart3, CheckCircle2, CreditCard, Scissors, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { currency } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [monthlyPayments, pendingPayments, editorPayments, completedEvents, pendingDeliverables] = await Promise.all([
    supabase.from("payments").select("advance_paid,total_amount,payment_status").gte("updated_at", monthStart).lt("updated_at", nextMonthStart),
    supabase.from("payments").select("balance_amount").neq("payment_status", "Fully Paid"),
    supabase.from("editing_tasks").select("editor_payment,status").neq("status", "Completed"),
    supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["Delivered", "Closed"]),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).neq("status", "Delivered")
  ]);

  const monthlyRevenue = (monthlyPayments.data ?? []).reduce((sum, payment) => {
    if (payment.payment_status === "Fully Paid") return sum + Number(payment.total_amount ?? 0);
    return sum + Number(payment.advance_paid ?? 0);
  }, 0);
  const pendingBalance = (pendingPayments.data ?? []).reduce((sum, payment) => sum + Number(payment.balance_amount ?? 0), 0);
  const editorDue = (editorPayments.data ?? []).reduce((sum, task) => sum + Number(task.editor_payment ?? 0), 0);

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
        <h2 className="text-2xl font-bold text-ink">Reports</h2>
        <p className="mt-1 text-sm text-zinc-500">Quick financial and fulfillment totals for the business.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.label} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-500">{report.label}</p>
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <p className="mt-4 text-2xl font-bold text-ink">{report.value}</p>
            </div>
          );
        })}
      </section>
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h3 className="font-semibold text-ink">Report notes</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Monthly revenue is calculated from payment records updated during the current month. Fully paid records count the full event total; other records count the advance paid. Pending balances and editor payments due are live operational totals.
        </p>
      </div>
    </div>
  );
}
