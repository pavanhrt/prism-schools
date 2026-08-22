"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateInvoiceSchema, type GenerateInvoiceInput } from "@/validations/fees";
import { generateInvoiceAction } from "@/features/fees/actions";
import type { FeeType } from "@/types/fees";
import type { AcademicYear } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GenerateInvoiceForm({
  students,
  feeTypes,
  academicYears,
}: {
  students: { id: string; admission_no: string; first_name: string; last_name: string }[];
  feeTypes: FeeType[];
  academicYears: AcademicYear[];
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenerateInvoiceInput>({
    resolver: zodResolver(generateInvoiceSchema),
    defaultValues: { items: [{ fee_type_id: "", amount: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: GenerateInvoiceInput) {
    setError(null);
    const result = await generateInvoiceAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/fees/invoices");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Generate invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="student_id">Student</Label>
              <select id="student_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("student_id")}>
                <option value="">Choose</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.admission_no} — {s.first_name} {s.last_name}</option>
                ))}
              </select>
              {errors.student_id && <p className="text-xs text-red-600">{errors.student_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="academic_year_id">Year</Label>
              <select id="academic_year_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("academic_year_id")}>
                <option value="">Choose</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.year_label}</option>)}
              </select>
              {errors.academic_year_id && <p className="text-xs text-red-600">{errors.academic_year_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
              {errors.due_date && <p className="text-xs text-red-600">{errors.due_date.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fee items</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...register(`items.${index}.fee_type_id` as const)}
                >
                  <option value="">Choose a fee type</option>
                  {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <Input
                  type="number"
                  step="0.01"
                  className="w-32"
                  placeholder="Amount"
                  {...register(`items.${index}.amount` as const)}
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append({ fee_type_id: "", amount: 0 })}>
              Add item
            </Button>
            {errors.items && <p className="text-xs text-red-600">{errors.items.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Generating…" : "Generate invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
