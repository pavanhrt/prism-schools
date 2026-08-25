import { describe, expect, it } from "vitest";
import { paginateOverdueStudents, summarizeFees } from "@/features/management-intelligence/fees-intelligence";
import type { OverdueStudentRow } from "@/features/management-intelligence/types";
import type { FeeInvoice, FeeInvoiceItem, FeePayment } from "@/types/fees";

function invoice(overrides: Partial<FeeInvoice>): FeeInvoice {
  return {
    id: "inv-1",
    student_id: "s1",
    academic_year_id: "year-1",
    invoice_no: "INV-1",
    due_date: "2026-08-01",
    total_amount: 10_000,
    created_at: "",
    updated_at: "",
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

function payment(overrides: Partial<FeePayment>): FeePayment {
  return {
    id: "pay-1",
    invoice_id: "inv-1",
    receipt_no: "R-1",
    amount: 4_000,
    payment_date: "2026-08-05",
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

const roster = new Map([
  ["s1", { admissionNo: "A001", studentName: "Asha", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" }],
]);

describe("fee totals and derivation", () => {
  it("totals invoiced, collected, and outstanding across invoices, ignoring voided payments", () => {
    const { summary } = summarizeFees({
      invoices: [invoice({ id: "inv-1", total_amount: 10_000 })],
      payments: [payment({ invoice_id: "inv-1", amount: 4_000, status: "verified" }), payment({ id: "pay-2", invoice_id: "inv-1", amount: 6_000, status: "voided" })],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(summary.totalInvoiced).toBe(10_000);
    expect(summary.totalCollected).toBe(4_000);
    expect(summary.outstanding).toBe(6_000);
    expect(summary.collectionPercentage).toBe(40);
  });

  it("is NOT_RECORDED with zero invoices", () => {
    const { summary } = summarizeFees({
      invoices: [],
      payments: [],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(summary.dataCoverage).toBe("NOT_RECORDED");
    expect(summary.collectionPercentage).toBeNull();
  });
});

describe("overdue detection", () => {
  it("does not flag a balance that is not yet past its due date", () => {
    const { summary, overdueStudents } = summarizeFees({
      invoices: [invoice({ due_date: "2026-08-20" })],
      payments: [],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(overdueStudents).toHaveLength(0);
    expect(summary.overdueAmount).toBe(0);
    expect(summary.studentsWithOutstanding).toBe(1);
  });

  it("flags a past-due balance with computed overdue days and severity", () => {
    const { summary, overdueStudents } = summarizeFees({
      invoices: [invoice({ due_date: "2026-07-01" })],
      payments: [],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(overdueStudents).toHaveLength(1);
    expect(overdueStudents[0].overdueDays).toBe(40);
    expect(overdueStudents[0].severity).toBe("CRITICAL");
    expect(summary.overdueAmount).toBe(10_000);
    expect(summary.studentsWithOverdue).toBe(1);
  });

  it("clears once the balance is fully paid", () => {
    const { summary, overdueStudents } = summarizeFees({
      invoices: [invoice({ due_date: "2026-07-01" })],
      payments: [payment({ amount: 10_000 })],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(overdueStudents).toHaveLength(0);
    expect(summary.studentsWithOutstanding).toBe(0);
  });
});

describe("phase 2b: students-with-invoice coverage", () => {
  it("counts distinct students with at least one invoice, for the Health Score fee-coverage component", () => {
    const { summary } = summarizeFees({
      invoices: [invoice({ id: "inv-1", student_id: "s1" }), invoice({ id: "inv-2", student_id: "s1" }), invoice({ id: "inv-3", student_id: "s2" })],
      payments: [],
      invoiceItems: [],
      feeTypeNames: new Map(),
      roster: new Map([
        ["s1", { admissionNo: "A001", studentName: "Asha", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" }],
        ["s2", { admissionNo: "A002", studentName: "Bala", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" }],
      ]),
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(summary.studentsWithInvoice).toBe(2);
  });
});

describe("phase 2b: overdue-students pagination", () => {
  function row(overrides: Partial<OverdueStudentRow>): OverdueStudentRow {
    return {
      studentId: "s1", admissionNo: "A1", studentName: "Student", className: "Class 1", sectionName: "A",
      invoiceId: "inv-1", invoiceNo: "INV-1", dueDate: "2026-07-01", overdueDays: 10, balance: 1000, severity: "WARNING",
      ...overrides,
    };
  }

  it("paginates without loading unlimited rows into one page", () => {
    const rows = Array.from({ length: 120 }, (_, i) => row({ studentId: `s${i}`, overdueDays: 120 - i }));
    const page1 = paginateOverdueStudents(rows, 1, 25);
    expect(page1.rows).toHaveLength(25);
    expect(page1.totalCount).toBe(120);
    expect(page1.rows[0].overdueDays).toBe(120);
    const page2 = paginateOverdueStudents(rows, 2, 25);
    expect(page2.rows).toHaveLength(25);
    expect(page2.rows[0].overdueDays).toBe(95);
  });

  it("clamps page size to a sane maximum", () => {
    const rows = Array.from({ length: 150 }, (_, i) => row({ studentId: `s${i}` }));
    const page = paginateOverdueStudents(rows, 1, 500);
    expect(page.pageSize).toBe(100);
    expect(page.rows).toHaveLength(100);
  });
});

describe("fee-type and class collection breakdown", () => {
  it("sums invoiced amounts per fee type across invoices", () => {
    const items: FeeInvoiceItem[] = [
      { id: "i1", invoice_id: "inv-1", fee_type_id: "tuition", amount: 8_000, created_at: "" },
      { id: "i2", invoice_id: "inv-1", fee_type_id: "transport", amount: 2_000, created_at: "" },
    ];
    const { feeTypeCollection, classCollection } = summarizeFees({
      invoices: [invoice({ total_amount: 10_000 })],
      payments: [payment({ amount: 3_000 })],
      invoiceItems: items,
      feeTypeNames: new Map([["tuition", "Tuition"], ["transport", "Transport"]]),
      roster,
      today: "2026-08-10",
      overdueWarningDays: 7,
      overdueCriticalDays: 30,
    });
    expect(feeTypeCollection).toEqual(expect.arrayContaining([
      { feeTypeId: "tuition", feeTypeName: "Tuition", invoiced: 8_000 },
      { feeTypeId: "transport", feeTypeName: "Transport", invoiced: 2_000 },
    ]));
    expect(classCollection[0]).toMatchObject({ classId: "c1", className: "Class 1", invoiced: 10_000, collected: 3_000 });
  });
});
