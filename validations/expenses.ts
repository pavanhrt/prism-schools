import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
});

export const expenseSchema = z.object({
  category_id: z.string().uuid("Choose a category"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  expense_date: z.string().min(1, "Date is required"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  paid_to: z.string().trim().max(200).optional().or(z.literal("")),
  payment_mode: z.enum(["cash", "upi", "bank_transfer", "cheque"]),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
