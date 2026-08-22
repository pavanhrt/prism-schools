"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  expenseCategorySchema,
  expenseSchema,
  type ExpenseCategoryInput,
  type ExpenseInput,
} from "@/validations/expenses";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createExpenseCategoryAction(
  input: ExpenseCategoryInput,
): Promise<ActionResult> {
  try {
    await requirePermission("expenses.edit");
    const parsed = expenseCategorySchema.parse(input);
    const supabase = await createClient();
    await service.createExpenseCategory(supabase, parsed.name);
    revalidatePath("/admin/expenses");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create category.");
  }
}

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  try {
    await requirePermission("expenses.create");
    const parsed = expenseSchema.parse(input);
    const supabase = await createClient();
    await service.createExpense(supabase, parsed);
    revalidatePath("/admin/expenses");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record expense.");
  }
}
