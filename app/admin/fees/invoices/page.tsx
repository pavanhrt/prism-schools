import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAllPayments, listInvoices } from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { listStudents } from "@/features/students/service";
import { listAcademicYears, listClasses } from "@/features/academics/repository";
import { BulkGenerateForm } from "@/features/fees/components/bulk-generate-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import type { InvoiceStatus } from "@/types/fees";

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "success" | "warning" | "outline"> = {
  unpaid: "outline",
  partial: "warning",
  paid: "success",
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const [invoices, payments, students, classes, academicYears, canCreate] = await Promise.all([
    listInvoices(supabase),
    listAllPayments(supabase),
    listStudents(supabase),
    listClasses(supabase),
    listAcademicYears(supabase),
    hasPermission("fees.create"),
  ]);

  const studentById = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">
            Paid amount and status are computed from the payment ledger — never stored on
            the invoice itself.
          </p>
        </div>
        {canCreate && (
          <Link href="/admin/fees/invoices/new" className={buttonVariants({})}>
            New invoice
          </Link>
        )}
      </div>

      {canCreate && <BulkGenerateForm classes={classes} academicYears={academicYears} />}

      <Table>
        <THead>
          <TR>
            <TH>Invoice</TH>
            <TH>Student</TH>
            <TH>Due date</TH>
            <TH className="text-right">Total</TH>
            <TH className="text-right">Paid</TH>
            <TH className="text-right">Balance</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {invoices.map((invoice) => {
            const { paidAmount, balance, status } = computeInvoiceBalance(invoice, payments);
            const student = studentById.get(invoice.student_id);
            return (
              <TR key={invoice.id}>
                <TD>
                  <Link href={`/admin/fees/invoices/${invoice.id}`} className="font-medium text-slate-900 underline">
                    {invoice.invoice_no}
                  </Link>
                </TD>
                <TD>{student ? `${student.first_name} ${student.last_name}` : "—"}</TD>
                <TD>{invoice.due_date}</TD>
                <TD className="text-right">₹{invoice.total_amount.toFixed(2)}</TD>
                <TD className="text-right">₹{paidAmount.toFixed(2)}</TD>
                <TD className="text-right">₹{balance.toFixed(2)}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
                </TD>
              </TR>
            );
          })}
          {invoices.length === 0 && (
            <TR>
              <TD colSpan={7} className="py-8 text-center text-slate-400">
                No invoices yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
