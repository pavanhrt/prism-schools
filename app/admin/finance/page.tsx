import { createClient } from "@/lib/supabase/server";
import { listAllPayments, listInvoices } from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { listExpenses } from "@/features/expenses/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FinancePage() {
  const supabase = await createClient();
  const [invoices, payments, expenses] = await Promise.all([
    listInvoices(supabase),
    listAllPayments(supabase),
    listExpenses(supabase),
  ]);

  const totalCollected = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + computeInvoiceBalance(invoice, payments).balance,
    0,
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const net = totalCollected - totalExpenses;

  const cards = [
    { label: "Fees collected", value: totalCollected, tone: "text-emerald-600" },
    { label: "Outstanding fees", value: totalOutstanding, tone: "text-amber-600" },
    { label: "Total expenses", value: totalExpenses, tone: "text-red-600" },
    { label: "Net position", value: net, tone: net >= 0 ? "text-emerald-600" : "text-red-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500">
          A running total, not a snapshot — every figure here is computed live from the
          payment ledger and expense records, same as the invoice-level numbers.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold ${c.tone}`}>₹{c.value.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
