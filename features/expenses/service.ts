import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { ExpenseInput } from "@/validations/expenses";

export const listExpenseCategories = repo.listExpenseCategories;
export const listExpenses = repo.listExpenses;

export async function createExpenseCategory(supabase: SupabaseClient, name: string) {
  return repo.insertExpenseCategory(supabase, name);
}

export async function createExpense(supabase: SupabaseClient, input: ExpenseInput) {
  return repo.insertExpense(supabase, {
    category_id: input.category_id,
    amount: input.amount,
    expense_date: input.expense_date,
    description: input.description || null,
    paid_to: input.paid_to || null,
    payment_mode: input.payment_mode,
  });
}
