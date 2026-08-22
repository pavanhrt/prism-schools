"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseCategorySchema,
  expenseSchema,
  type ExpenseCategoryInput,
  type ExpenseInput,
} from "@/validations/expenses";
import { createExpenseAction, createExpenseCategoryAction } from "@/features/expenses/actions";
import type { Expense, ExpenseCategory } from "@/types/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function ExpensesManager({
  initialExpenses: expenses,
  categories,
  canCreate,
  canEditCategories,
}: {
  initialExpenses: Expense[];
  categories: ExpenseCategory[];
  canCreate: boolean;
  canEditCategories: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const router = useRouter();
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  const expenseForm = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { payment_mode: "cash", expense_date: new Date().toISOString().slice(0, 10) },
  });
  const categoryForm = useForm<ExpenseCategoryInput>({ resolver: zodResolver(expenseCategorySchema) });

  async function onSubmitExpense(values: ExpenseInput) {
    setError(null);
    const result = await createExpenseAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    expenseForm.reset({ payment_mode: "cash", expense_date: new Date().toISOString().slice(0, 10) });
    router.refresh();
  }

  async function onSubmitCategory(values: ExpenseCategoryInput) {
    setCategoryError(null);
    const result = await createExpenseCategoryAction(values);
    if (!result.ok) {
      setCategoryError(result.error);
      return;
    }
    categoryForm.reset({ name: "" });
    router.refresh();
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {canCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Record expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category_id">Category</Label>
                    <select id="category_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...expenseForm.register("category_id")}>
                      <option value="">Choose</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {expenseForm.formState.errors.category_id && (
                      <p className="text-xs text-red-600">{expenseForm.formState.errors.category_id.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" step="0.01" {...expenseForm.register("amount")} />
                    {expenseForm.formState.errors.amount && (
                      <p className="text-xs text-red-600">{expenseForm.formState.errors.amount.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="expense_date">Date</Label>
                    <Input id="expense_date" type="date" {...expenseForm.register("expense_date")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="payment_mode">Mode</Label>
                    <select id="payment_mode" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...expenseForm.register("payment_mode")}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="paid_to">Paid to</Label>
                  <Input id="paid_to" {...expenseForm.register("paid_to")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" {...expenseForm.register("description")} />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={expenseForm.formState.isSubmitting} className="self-start">
                  {expenseForm.formState.isSubmitting ? "Recording…" : "Record expense"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canEditCategories && (
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="name">New category</Label>
                  <Input id="name" placeholder="Maintenance" {...categoryForm.register("name")} />
                </div>
                <Button type="submit" size="sm" disabled={categoryForm.formState.isSubmitting}>
                  Add
                </Button>
              </form>
              {categoryError && <p className="mt-2 text-sm text-red-600">{categoryError}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <span key={c.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                    {c.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Expense</TH>
            <TH>Date</TH>
            <TH>Category</TH>
            <TH>Paid to</TH>
            <TH className="text-right">Amount</TH>
          </TR>
        </THead>
        <TBody>
          {expenses.map((e) => (
            <TR key={e.id}>
              <TD className="font-medium text-slate-900">{e.expense_no}</TD>
              <TD>{e.expense_date}</TD>
              <TD>{categoryById.get(e.category_id) ?? "—"}</TD>
              <TD>{e.paid_to ?? "—"}</TD>
              <TD className="text-right">₹{e.amount.toFixed(2)}</TD>
            </TR>
          ))}
          {expenses.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No expenses recorded yet.
              </TD>
            </TR>
          )}
        </TBody>
        {expenses.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={4} className="px-4 py-2.5 text-right text-sm font-medium text-slate-700">Total</td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-900">₹{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
      </Table>
    </div>
  );
}
