import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import {
  getInvoice,
  listFeeTypes,
  listInvoiceItems,
  listPaymentsForInvoice,
} from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { getStudent } from "@/features/students/service";
import { InvoiceDetail } from "@/features/fees/components/invoice-detail";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const invoice = await getInvoice(supabase, id);
  if (!invoice) notFound();

  const [items, payments, feeTypes, student, canCollect, canVoid] = await Promise.all([
    listInvoiceItems(supabase, id),
    listPaymentsForInvoice(supabase, id),
    listFeeTypes(supabase),
    getStudent(supabase, invoice.student_id),
    hasPermission("fees.collect"),
    hasPermission("fees.refund"),
  ]);

  const feeTypeById = new Map(feeTypes.map((f) => [f.id, f]));
  const { paidAmount, balance } = computeInvoiceBalance(invoice, payments);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{invoice.invoice_no}</h1>
        <p className="text-sm text-slate-500">
          {student ? `${student.first_name} ${student.last_name} (${student.admission_no})` : "—"} · due {invoice.due_date}
        </p>
      </div>
      <InvoiceDetail
        invoiceId={id}
        items={items}
        payments={payments}
        feeTypeById={feeTypeById}
        totalAmount={invoice.total_amount}
        paidAmount={paidAmount}
        balance={balance}
        canCollect={canCollect}
        canVoid={canVoid}
      />
    </div>
  );
}
