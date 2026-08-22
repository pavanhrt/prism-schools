import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listExpenseCategories, listExpenses } from "@/features/expenses/service";
import { ExpensesManager } from "@/features/expenses/components/expenses-manager";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const [expenses, categories, canCreate, canEditCategories] = await Promise.all([
    listExpenses(supabase),
    listExpenseCategories(supabase),
    hasPermission("expenses.create"),
    hasPermission("expenses.edit"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Expenses</h1>
      </div>
      <ExpensesManager
        initialExpenses={expenses}
        categories={categories}
        canCreate={canCreate}
        canEditCategories={canEditCategories}
      />
    </div>
  );
}
