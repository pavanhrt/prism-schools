import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import * as studentsService from "@/features/students/service";
import type {
  BulkGenerateInvoicesInput,
  CollectPaymentInput,
  FeeStructureInput,
  FeeTypeInput,
  GenerateInvoiceInput,
} from "@/validations/fees";

export const listFeeTypes = repo.listFeeTypes;
export const listFeeStructures = repo.listFeeStructures;
export const listInvoices = repo.listInvoices;
export const getInvoice = repo.getInvoice;
export const listInvoiceItems = repo.listInvoiceItems;
export const listAllInvoiceItems = repo.listAllInvoiceItems;
export const listInvoiceItemsForInvoices = repo.listInvoiceItemsForInvoices;
export const listInvoicesForYear = repo.listInvoicesForYear;
export const listPaymentsForInvoices = repo.listPaymentsForInvoices;
export const listAllPayments = repo.listAllPayments;
export const getPayment = repo.getPayment;
export const listPaymentsForInvoice = repo.listPaymentsForInvoice;
export const voidPayment = repo.voidPayment;

export async function createFeeType(supabase: SupabaseClient, input: FeeTypeInput) {
  return repo.insertFeeType(supabase, {
    name: input.name,
    frequency: input.frequency,
    description: input.description || null,
  });
}

export async function createFeeStructure(supabase: SupabaseClient, input: FeeStructureInput) {
  return repo.insertFeeStructure(supabase, input);
}

/** Invoice + line items in one operation — total_amount is the sum of the
 * items being inserted right now, never recomputed later (blueprint §16:
 * historical invoices don't change when the fee structure later does). */
export async function generateInvoice(supabase: SupabaseClient, input: GenerateInvoiceInput) {
  const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);
  const invoice = await repo.insertInvoice(supabase, {
    student_id: input.student_id,
    academic_year_id: input.academic_year_id,
    due_date: input.due_date,
    total_amount: totalAmount,
  });
  await repo.insertInvoiceItems(
    supabase,
    input.items.map((item) => ({
      invoice_id: invoice.id,
      fee_type_id: item.fee_type_id,
      amount: item.amount,
    })),
  );
  return invoice;
}

/** One invoice per currently-enrolled student in the class, built from
 * whatever fee_structures rows exist for that class + year. Skips a
 * student if the class has no fee structure configured at all, rather
 * than generating a zero-amount invoice. */
export async function bulkGenerateInvoices(
  supabase: SupabaseClient,
  input: BulkGenerateInvoicesInput,
) {
  const [roster, structures] = await Promise.all([
    studentsService.listRosterForClass(supabase, input.class_id),
    repo.listFeeStructures(supabase),
  ]);

  const applicable = structures.filter(
    (s) => s.class_id === input.class_id && s.academic_year_id === input.academic_year_id,
  );
  if (applicable.length === 0) {
    throw new Error("No fee structure is configured for this class and year yet.");
  }

  const totalAmount = applicable.reduce((sum, s) => sum + s.amount, 0);
  let created = 0;

  for (const student of roster) {
    const invoice = await repo.insertInvoice(supabase, {
      student_id: student.student_id,
      academic_year_id: input.academic_year_id,
      due_date: input.due_date,
      total_amount: totalAmount,
    });
    await repo.insertInvoiceItems(
      supabase,
      applicable.map((s) => ({
        invoice_id: invoice.id,
        fee_type_id: s.fee_type_id,
        amount: s.amount,
      })),
    );
    created += 1;
  }

  return { created };
}

export async function collectPayment(supabase: SupabaseClient, input: CollectPaymentInput) {
  return repo.insertPayment(supabase, {
    invoice_id: input.invoice_id,
    amount: input.amount,
    payment_date: input.payment_date,
    payment_mode: input.payment_mode,
    transaction_ref: input.transaction_ref || null,
    note: input.note || null,
  });
}
