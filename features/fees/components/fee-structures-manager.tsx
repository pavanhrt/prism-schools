"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feeStructureSchema, type FeeStructureInput } from "@/validations/fees";
import { createFeeStructureAction } from "@/features/fees/actions";
import type { FeeStructure, FeeType } from "@/types/fees";
import type { AcademicYear, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function FeeStructuresManager({
  initialStructures: structures,
  classes,
  feeTypes,
  academicYears,
  canManage,
}: {
  initialStructures: FeeStructure[];
  classes: SchoolClass[];
  feeTypes: FeeType[];
  academicYears: AcademicYear[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const feeTypeById = new Map(feeTypes.map((f) => [f.id, f.name]));
  const yearById = new Map(academicYears.map((y) => [y.id, y.year_label]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeeStructureInput>({ resolver: zodResolver(feeStructureSchema) });

  async function onSubmit(values: FeeStructureInput) {
    setError(null);
    const result = await createFeeStructureAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ academic_year_id: values.academic_year_id, class_id: values.class_id, fee_type_id: "", amount: 0 });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Add fee structure</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="academic_year_id">Year</Label>
                  <select id="academic_year_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("academic_year_id")}>
                    <option value="">Choose</option>
                    {academicYears.map((y) => <option key={y.id} value={y.id}>{y.year_label}</option>)}
                  </select>
                  {errors.academic_year_id && <p className="text-xs text-red-600">{errors.academic_year_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="class_id">Class</Label>
                  <select id="class_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("class_id")}>
                    <option value="">Choose</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.class_id && <p className="text-xs text-red-600">{errors.class_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fee_type_id">Fee type</Label>
                  <select id="fee_type_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("fee_type_id")}>
                    <option value="">Choose</option>
                    {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {errors.fee_type_id && <p className="text-xs text-red-600">{errors.fee_type_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" {...register("amount")} />
                  {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Year</TH>
            <TH>Class</TH>
            <TH>Fee type</TH>
            <TH className="text-right">Amount</TH>
          </TR>
        </THead>
        <TBody>
          {structures.map((s) => (
            <TR key={s.id}>
              <TD>{yearById.get(s.academic_year_id) ?? "—"}</TD>
              <TD>{classById.get(s.class_id) ?? "—"}</TD>
              <TD>{feeTypeById.get(s.fee_type_id) ?? "—"}</TD>
              <TD className="text-right">₹{s.amount.toFixed(2)}</TD>
            </TR>
          ))}
          {structures.length === 0 && (
            <TR>
              <TD colSpan={4} className="py-8 text-center text-slate-400">
                No fee structure configured yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
