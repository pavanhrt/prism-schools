import { computeInvoiceBalance } from "@/features/fees/balance";
import type { FeeInvoice, FeeInvoiceItem, FeePayment } from "@/types/fees";
import { feeOverdueSeverity } from "./rules";
import type { AlertSeverity, CoverageStatus, FeeSummary, OverdueStudentRow } from "./types";

const DAY_MS = 86_400_000;

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00.000Z`).getTime() - new Date(`${from}T00:00:00.000Z`).getTime()) / DAY_MS);
}

export interface FeeRosterEntry {
  admissionNo: string;
  studentName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
}

export interface ClassCollectionRow {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  collectionPercentage: number | null;
}

export interface FeeTypeCollectionRow {
  feeTypeId: string;
  feeTypeName: string;
  invoiced: number;
}

export interface MonthlyCollectionRow {
  month: string;
  collected: number;
}

export function summarizeFees(params: {
  invoices: FeeInvoice[];
  payments: FeePayment[];
  invoiceItems: FeeInvoiceItem[];
  feeTypeNames: Map<string, string>;
  roster: Map<string, FeeRosterEntry>;
  today: string;
  overdueWarningDays: number;
  overdueCriticalDays: number;
}): {
  summary: FeeSummary;
  classCollection: ClassCollectionRow[];
  feeTypeCollection: FeeTypeCollectionRow[];
  monthlyCollection: MonthlyCollectionRow[];
  overdueStudents: OverdueStudentRow[];
} {
  const { invoices, payments, invoiceItems, feeTypeNames, roster, today, overdueWarningDays, overdueCriticalDays } = params;

  const paymentsByInvoice = new Map<string, FeePayment[]>();
  for (const payment of payments) {
    paymentsByInvoice.set(payment.invoice_id, [...(paymentsByInvoice.get(payment.invoice_id) ?? []), payment]);
  }
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  let totalInvoiced = 0;
  let totalCollected = 0;
  let outstanding = 0;
  let overdueAmount = 0;
  const studentsWithOutstanding = new Set<string>();
  const studentsWithOverdue = new Set<string>();
  const overdueStudents: OverdueStudentRow[] = [];
  const classGroups = new Map<string, ClassCollectionRow>();

  for (const invoice of invoices) {
    const invoicePayments = paymentsByInvoice.get(invoice.id) ?? [];
    const balance = computeInvoiceBalance(invoice, invoicePayments);
    totalInvoiced += invoice.total_amount;
    totalCollected += balance.paidAmount;
    outstanding += balance.balance;

    const student = roster.get(invoice.student_id);
    const groupKey = student ? `${student.classId}:${student.sectionId}` : "unassigned";
    const entry = classGroups.get(groupKey) ?? {
      classId: student?.classId ?? "unassigned",
      className: student?.className ?? "Not currently enrolled",
      sectionId: student?.sectionId ?? "unassigned",
      sectionName: student?.sectionName ?? "—",
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      collectionPercentage: null,
    };
    entry.invoiced += invoice.total_amount;
    entry.collected += balance.paidAmount;
    entry.outstanding += balance.balance;
    classGroups.set(groupKey, entry);

    if (balance.balance > 0) {
      studentsWithOutstanding.add(invoice.student_id);
      const overdueDays = invoice.due_date < today ? daysBetween(invoice.due_date, today) : 0;
      if (overdueDays > 0) {
        overdueAmount += balance.balance;
        studentsWithOverdue.add(invoice.student_id);
        overdueStudents.push({
          studentId: invoice.student_id,
          admissionNo: student?.admissionNo ?? "—",
          studentName: student?.studentName ?? "Unknown student",
          className: student?.className ?? "—",
          sectionName: student?.sectionName ?? "—",
          invoiceId: invoice.id,
          invoiceNo: invoice.invoice_no,
          dueDate: invoice.due_date,
          overdueDays,
          balance: balance.balance,
          severity: (feeOverdueSeverity(overdueDays, overdueWarningDays, overdueCriticalDays) ?? "INFO") as AlertSeverity,
        });
      }
    }
  }

  for (const entry of classGroups.values()) {
    entry.collectionPercentage = entry.invoiced > 0 ? Math.round((entry.collected / entry.invoiced) * 10_000) / 100 : null;
  }

  const feeTypeTotals = new Map<string, number>();
  for (const item of invoiceItems) {
    if (!invoiceById.has(item.invoice_id)) continue;
    feeTypeTotals.set(item.fee_type_id, (feeTypeTotals.get(item.fee_type_id) ?? 0) + item.amount);
  }
  const feeTypeCollection: FeeTypeCollectionRow[] = [...feeTypeTotals.entries()].map(([feeTypeId, invoiced]) => ({
    feeTypeId,
    feeTypeName: feeTypeNames.get(feeTypeId) ?? "Unknown fee type",
    invoiced,
  }));

  const monthlyTotals = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== "verified" || !invoiceById.has(payment.invoice_id)) continue;
    const month = payment.payment_date.slice(0, 7);
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + payment.amount);
  }
  const monthlyCollection: MonthlyCollectionRow[] = [...monthlyTotals.entries()]
    .map(([month, collected]) => ({ month, collected }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const collectionPercentage = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 10_000) / 100 : null;
  const dataCoverage: CoverageStatus = invoices.length === 0 ? "NOT_RECORDED" : "COMPLETE";

  return {
    summary: {
      totalInvoiced,
      totalCollected,
      outstanding,
      collectionPercentage,
      overdueAmount,
      studentsWithOutstanding: studentsWithOutstanding.size,
      studentsWithOverdue: studentsWithOverdue.size,
      invoiceCount: invoices.length,
      dataCoverage,
    },
    classCollection: [...classGroups.values()],
    feeTypeCollection,
    monthlyCollection,
    overdueStudents: overdueStudents.sort((a, b) => b.overdueDays - a.overdueDays),
  };
}
