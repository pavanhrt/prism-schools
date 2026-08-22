import { z } from "zod";

export const feeTypeSchema = z.object({
  name: z.string().trim().min(1, "Fee type name is required").max(100),
  frequency: z.enum(["monthly", "quarterly", "annually", "one_time"]),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const feeStructureSchema = z.object({
  academic_year_id: z.string().uuid("Choose an academic year"),
  class_id: z.string().uuid("Choose a class"),
  fee_type_id: z.string().uuid("Choose a fee type"),
  amount: z.coerce.number().min(0, "Amount can't be negative"),
});

export const generateInvoiceSchema = z.object({
  student_id: z.string().uuid("Choose a student"),
  academic_year_id: z.string().uuid("Choose an academic year"),
  due_date: z.string().min(1, "Due date is required"),
  items: z
    .array(
      z.object({
        fee_type_id: z.string().uuid(),
        amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
      }),
    )
    .min(1, "Add at least one fee item"),
});

export const bulkGenerateInvoicesSchema = z.object({
  class_id: z.string().uuid("Choose a class"),
  academic_year_id: z.string().uuid("Choose an academic year"),
  due_date: z.string().min(1, "Due date is required"),
});

export const collectPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_mode: z.enum(["cash", "upi", "bank_transfer", "cheque"]),
  transaction_ref: z.string().trim().max(100).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const voidPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export type FeeTypeInput = z.infer<typeof feeTypeSchema>;
export type FeeStructureInput = z.infer<typeof feeStructureSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type BulkGenerateInvoicesInput = z.infer<typeof bulkGenerateInvoicesSchema>;
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;
