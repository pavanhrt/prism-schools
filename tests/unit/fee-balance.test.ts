import { describe, expect, it } from "vitest";
import { computeInvoiceBalance } from "@/features/fees/balance";
import type { FeeInvoice, FeePayment } from "@/types/fees";

function makeInvoice(totalAmount: number): FeeInvoice {
  return {
    id: "invoice-1",
    student_id: "student-1",
    academic_year_id: "year-1",
    invoice_no: "INV-00001",
    due_date: "2026-06-01",
    total_amount: totalAmount,
    created_at: "",
    updated_at: "",
    created_by: null,
    updated_by: null,
  };
}

function makePayment(overrides: Partial<FeePayment>): FeePayment {
  return {
    id: "payment-1",
    invoice_id: "invoice-1",
    receipt_no: "REC-00001",
    amount: 0,
    payment_date: "2026-06-01",
    payment_mode: "cash",
    transaction_ref: null,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    razorpay_signature: null,
    note: null,
    status: "verified",
    voided_at: null,
    voided_by: null,
    void_reason: null,
    created_at: "",
    created_by: null,
    ...overrides,
  };
}

describe("computeInvoiceBalance", () => {
  it("is unpaid when there are no payments", () => {
    const result = computeInvoiceBalance(makeInvoice(1000), []);
    expect(result).toMatchObject({ paidAmount: 0, balance: 1000, status: "unpaid" });
  });

  it("is partial when some but not all of the total has been paid", () => {
    const payments = [makePayment({ amount: 400 })];
    const result = computeInvoiceBalance(makeInvoice(1000), payments);
    expect(result).toMatchObject({ paidAmount: 400, balance: 600, status: "partial" });
  });

  it("is paid once payments cover the total, across multiple entries", () => {
    const payments = [makePayment({ id: "p1", amount: 600 }), makePayment({ id: "p2", amount: 400 })];
    const result = computeInvoiceBalance(makeInvoice(1000), payments);
    expect(result).toMatchObject({ paidAmount: 1000, balance: 0, status: "paid" });
  });

  it("excludes voided payments from the paid amount — this is the whole point of voiding instead of deleting", () => {
    const payments = [
      makePayment({ id: "p1", amount: 1000, status: "verified" }),
      makePayment({ id: "p2", amount: 1000, status: "voided" }),
    ];
    const result = computeInvoiceBalance(makeInvoice(1000), payments);
    expect(result).toMatchObject({ paidAmount: 1000, balance: 0, status: "paid" });
  });

  it("ignores payments belonging to a different invoice", () => {
    const payments = [makePayment({ invoice_id: "some-other-invoice", amount: 1000 })];
    const result = computeInvoiceBalance(makeInvoice(1000), payments);
    expect(result).toMatchObject({ paidAmount: 0, balance: 1000, status: "unpaid" });
  });

  it("never reports a negative balance on overpayment", () => {
    const payments = [makePayment({ amount: 1200 })];
    const result = computeInvoiceBalance(makeInvoice(1000), payments);
    expect(result.balance).toBe(0);
    expect(result.status).toBe("paid");
  });
});
