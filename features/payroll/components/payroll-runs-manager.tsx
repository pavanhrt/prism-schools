"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayrollRunSchema, type CreatePayrollRunInput } from "@/validations/payroll";
import { createPayrollRunAction } from "@/features/payroll/actions";
import type { PayrollRun, PayrollRunStatus } from "@/types/payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<PayrollRunStatus, "default" | "success" | "warning" | "outline"> = {
  draft: "outline",
  calculated: "warning",
  reviewed: "warning",
  approved: "warning",
  processed: "success",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PayrollRunsManager({
  initialRuns: runs,
  canCreate,
}: {
  initialRuns: PayrollRun[];
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const now = new Date();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePayrollRunInput>({
    resolver: zodResolver(createPayrollRunSchema),
    defaultValues: { month: now.getMonth() + 1, year: now.getFullYear() },
  });

  async function onSubmit(values: CreatePayrollRunInput) {
    setError(null);
    const result = await createPayrollRunAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/admin/payroll/${result.runId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>New payroll run</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="month">Month</Label>
                <select id="month" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("month")}>
                  {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" className="w-24" {...register("year")} />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create run"}
              </Button>
            </form>
            {(errors.month || errors.year) && <p className="mt-2 text-xs text-red-600">Check month/year.</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Period</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {runs.map((r) => (
            <TR key={r.id}>
              <TD className="font-medium text-slate-900">{MONTH_NAMES[r.month - 1]} {r.year}</TD>
              <TD><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></TD>
              <TD>
                <Link href={`/admin/payroll/${r.id}`} className="text-sm text-slate-600 underline">
                  Open
                </Link>
              </TD>
            </TR>
          ))}
          {runs.length === 0 && (
            <TR>
              <TD colSpan={3} className="py-8 text-center text-slate-400">No payroll runs yet.</TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
