"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bulkGenerateInvoicesSchema,
  type BulkGenerateInvoicesInput,
} from "@/validations/fees";
import { bulkGenerateInvoicesAction } from "@/features/fees/actions";
import type { AcademicYear, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BulkGenerateForm({
  classes,
  academicYears,
}: {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BulkGenerateInvoicesInput>({ resolver: zodResolver(bulkGenerateInvoicesSchema) });

  async function onSubmit(values: BulkGenerateInvoicesInput) {
    setError(null);
    setMessage(null);
    const result = await bulkGenerateInvoicesAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Invoices generated for the whole class.");
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Bulk-generate for a class</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="class_id">Class</Label>
            <select id="class_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("class_id")}>
              <option value="">Choose</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="academic_year_id">Year</Label>
            <select id="academic_year_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("academic_year_id")}>
              <option value="">Choose</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.year_label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" type="date" {...register("due_date")} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating…" : "Generate for every enrolled student"}
          </Button>
        </form>
        {(errors.class_id || errors.academic_year_id || errors.due_date) && (
          <p className="mt-2 text-xs text-red-600">All three fields are required.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
      </CardContent>
    </Card>
  );
}
