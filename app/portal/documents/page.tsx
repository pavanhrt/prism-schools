import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listInvoices, listAllPayments } from "@/features/fees/service";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Scoped to fee receipts only — the only document generation that already
 * exists (/api/fees/receipts/[paymentId]). Report cards, admit cards and
 * certificates are deliberately out of scope here; PROJECT_CONTEXT.md
 * documents those as deferred elsewhere in the system, not something to
 * invent for this portal pass.
 */
export default async function PortalDocumentsPage({
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

  const [invoices, payments] = await Promise.all([listInvoices(supabase), listAllPayments(supabase)]);
  const myInvoiceIds = new Set(invoices.filter((i) => i.student_id === active.id).map((i) => i.id));
  const receipts = payments
    .filter((p) => myInvoiceIds.has(p.invoice_id) && p.status === "verified")
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Documents</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>Fee receipts</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {receipts.map((r) => (
            <a
              key={r.id}
              href={`/api/fees/receipts/${r.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="text-slate-700">{r.receipt_no}</span>
              <span className="text-slate-500">{r.payment_date} · ₹{r.amount.toFixed(2)}</span>
            </a>
          ))}
          {receipts.length === 0 && <p className="py-6 text-center text-slate-400">No receipts yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
