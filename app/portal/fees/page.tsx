import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listInvoices, listAllPayments } from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { PayNowButton } from "@/features/fees/components/pay-now-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function PortalFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);
  if (!active) return <p className="text-sm text-slate-500">No student linked to your account.</p>;

  const [allInvoices, payments] = await Promise.all([
    listInvoices(supabase),
    listAllPayments(supabase),
  ]);
  const invoices = allInvoices.filter((i) => i.student_id === active.id);
  const totalBalance = invoices.reduce((sum, inv) => sum + computeInvoiceBalance(inv, payments).balance, 0);
  const nextDue = invoices
    .filter((inv) => computeInvoiceBalance(inv, payments).balance > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Fees</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle>Total due</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">₹{totalBalance.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Next due date</CardTitle></CardHeader>
          <CardContent>
            {nextDue ? (
              <>
                <p className={`text-lg font-semibold ${nextDue.due_date < today ? "text-red-600" : "text-slate-900"}`}>{nextDue.due_date}</p>
                <p className="text-xs text-slate-500">{nextDue.invoice_no}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Nothing due.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {invoices.map((invoice) => {
          const { paidAmount, balance, status } = computeInvoiceBalance(invoice, payments);
          const myPayments = payments.filter((p) => p.invoice_id === invoice.id && p.status === "verified");
          return (
            <Card key={invoice.id}>
              <CardHeader>
                <CardTitle>{invoice.invoice_no}</CardTitle>
                <Badge variant={status === "paid" ? "success" : status === "partial" ? "warning" : "outline"}>{status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-slate-500">Total</dt><dd className="font-medium text-slate-900">₹{invoice.total_amount.toFixed(2)}</dd></div>
                  <div><dt className="text-slate-500">Paid</dt><dd className="font-medium text-emerald-600">₹{paidAmount.toFixed(2)}</dd></div>
                  <div><dt className="text-slate-500">Balance</dt><dd className="font-medium text-slate-900">₹{balance.toFixed(2)}</dd></div>
                </dl>
                {myPayments.length > 0 && (
                  <Table>
                    <THead><TR><TH>Receipt</TH><TH>Date</TH><TH>Mode</TH><TH className="text-right">Amount</TH></TR></THead>
                    <TBody>
                      {myPayments.map((p) => (
                        <TR key={p.id}>
                          <TD>{p.receipt_no}</TD><TD>{p.payment_date}</TD><TD className="capitalize">{p.payment_mode.replace("_", " ")}</TD>
                          <TD className="text-right">₹{p.amount.toFixed(2)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
                {balance > 0 && (
                  <PayNowButton invoiceId={invoice.id} invoiceNo={invoice.invoice_no} studentName={`${active.first_name} ${active.last_name}`} />
                )}
              </CardContent>
            </Card>
          );
        })}
        {invoices.length === 0 && <p className="py-8 text-center text-slate-400">No invoices yet.</p>}
      </div>
    </div>
  );
}
