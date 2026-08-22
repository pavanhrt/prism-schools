import type { FeeInvoice, FeePayment, InvoiceBalance, InvoiceStatus } from "@/types/fees";

/**
 * The whole point of dropping fee_invoices.paid_amount (blueprint §06):
 * paid/balance/status are computed here, every time, from the actual
 * payment ledger — never a stored column that can drift from reality if a
 * payment is voided or the invoice is otherwise touched.
 */
export function computeInvoiceBalance(
  invoice: FeeInvoice,
  payments: FeePayment[],
): InvoiceBalance {
  const paidAmount = payments
    .filter((p) => p.status === "verified" && p.invoice_id === invoice.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const balance = Math.max(invoice.total_amount - paidAmount, 0);

  let status: InvoiceStatus;
  if (paidAmount <= 0) status = "unpaid";
  else if (paidAmount >= invoice.total_amount) status = "paid";
  else status = "partial";

  return { invoice, paidAmount, balance, status };
}
