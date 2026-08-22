import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseCategory } from "@/types/expenses";

export async function listExpenseCategories(
  supabase: SupabaseClient,
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertExpenseCategory(
  supabase: SupabaseClient,
  name: string,
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listExpenses(supabase: SupabaseClient): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewExpense = Pick<
  Expense,
  "category_id" | "amount" | "expense_date" | "description" | "paid_to" | "payment_mode"
>;

export async function insertExpense(
  supabase: SupabaseClient,
  input: NewExpense,
): Promise<Expense> {
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data;
}
