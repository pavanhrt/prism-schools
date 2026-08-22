"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdjustmentSchema, type CreateAdjustmentInput } from "@/validations/payroll";
import { createAdjustmentAction } from "@/features/payroll/actions";
import type { PayrollAdjustment } from "@/types/payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdjustmentForm({
  staffId,
  existing,
}: {
  staffId: string;
  existing: PayrollAdjustment[];
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdjustmentInput>({
    resolver: zodResolver(createAdjustmentSchema),
    defaultValues: { staff_id: staffId },
  });

  async function onSubmit(values: CreateAdjustmentInput) {
    setError(null);
    const result = await createAdjustmentAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ staff_id: staffId, amount: 0, reason: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-500">
          Positive = owed to staff (folded in as a bonus next run). Negative = recovery
          (folded in as a deduction). Applied automatically the next time payroll is
          calculated — never edits a processed run directly.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
          <input type="hidden" {...register("staff_id")} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" className="w-32" {...register("amount")} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" {...register("reason")} />
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add"}
          </Button>
        </form>
        {(errors.amount || errors.reason) && (
          <p className="mt-1 text-xs text-red-600">{errors.amount?.message || errors.reason?.message}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-col divide-y divide-slate-100">
          {existing.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className={a.amount >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {a.amount >= 0 ? "+" : ""}₹{a.amount.toFixed(2)}
                </span>{" "}
                <span className="text-slate-600">{a.reason}</span>
              </div>
              <span className="text-xs text-slate-400">
                {a.applied_in_payroll_run_id ? "applied" : "pending"}
              </span>
            </div>
          ))}
          {existing.length === 0 && <p className="py-4 text-center text-slate-400">No adjustments.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
