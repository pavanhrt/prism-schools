import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import {
  getPayment,
  getInvoice,
  listInvoiceItems,
  listPaymentsForInvoice,
  listFeeTypes,
} from "@/features/fees/service";
import { getStudent, listEnrollmentsForStudent } from "@/features/students/service";
import { listClasses, listSections } from "@/features/academics/repository";
import { getSchoolSettings } from "@/features/settings/repository";
import { FeeReceiptDocument } from "@/features/fees/pdf/receipt-document";

/**
 * No requirePermission call here on purpose, same reasoning as
 * createPaymentOrderAction (features/fees/actions.ts) — fee_payments_select
 * RLS (0024_portal_access.sql) already scopes reads to fees.view holders or
 * the owning student/parent, so a null result here means "not yours or
 * doesn't exist" and either way nothing renders.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const payment = await getPayment(supabase, paymentId);
  if (!payment || payment.status === "voided") {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }

  const invoice = await getInvoice(supabase, payment.invoice_id);
  if (!invoice) {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }

  const [items, allPayments, feeTypes, student, enrollments, classes, sections, school] =
    await Promise.all([
      listInvoiceItems(supabase, invoice.id),
      listPaymentsForInvoice(supabase, invoice.id),
      listFeeTypes(supabase),
      getStudent(supabase, invoice.student_id),
      listEnrollmentsForStudent(supabase, invoice.student_id),
      listClasses(supabase),
      listSections(supabase),
      getSchoolSettings(supabase),
    ]);

  const feeTypeNameById = new Map(feeTypes.map((f) => [f.id, f.name]));
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));
  const currentEnrollment = enrollments.find((e) => e.is_current) ?? null;

  // Point-in-time balance, not the invoice's current balance — a receipt
  // must stay historically accurate even if more payments land afterward.
  const paidToDate = allPayments
    .filter((p) => p.status === "verified" && p.created_at <= payment.created_at)
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(invoice.total_amount - paidToDate, 0);

  // renderToBuffer's type only accepts a <Document> element directly; it
  // has no way to express "a component that returns one" — safe to widen
  // here since FeeReceiptDocument's own return type is checked at its
  // definition.
  const documentElement = createElement(FeeReceiptDocument, {
    school,
    payment,
    invoice,
    items,
    feeTypeNameById,
    studentName: student ? `${student.first_name} ${student.last_name}` : "—",
    admissionNo: student?.admission_no ?? "—",
    className: currentEnrollment ? (classById.get(currentEnrollment.class_id) ?? null) : null,
    sectionName: currentEnrollment ? (sectionById.get(currentEnrollment.section_id) ?? null) : null,
    paidToDate,
    balance,
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  const buffer = await renderToBuffer(documentElement);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${payment.receipt_no}.pdf"`,
    },
  });
}
