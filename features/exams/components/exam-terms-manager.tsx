"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { examTermSchema, type ExamTermInput } from "@/validations/exams";
import { createExamTermAction } from "@/features/exams/actions";
import type { ExamTerm } from "@/types/exams";
import type { AcademicYear } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function ExamTermsManager({
  initialTerms: terms,
  academicYears,
  canCreate,
}: {
  initialTerms: ExamTerm[];
  academicYears: AcademicYear[];
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const yearById = new Map(academicYears.map((y) => [y.id, y.year_label]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamTermInput>({ resolver: zodResolver(examTermSchema) });

  async function onSubmit(values: ExamTermInput) {
    setError(null);
    const result = await createExamTermAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ academic_year_id: values.academic_year_id, name: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add exam term</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="academic_year_id">Academic year</Label>
                <select id="academic_year_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("academic_year_id")}>
                  <option value="">Choose</option>
                  {academicYears.map((y) => <option key={y.id} value={y.id}>{y.year_label}</option>)}
                </select>
                {errors.academic_year_id && <p className="text-xs text-red-600">{errors.academic_year_id.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Term name</Label>
                <Input id="name" placeholder="Term 1" {...register("name")} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add term"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Term</TH>
            <TH>Academic year</TH>
          </TR>
        </THead>
        <TBody>
          {terms.map((t) => (
            <TR key={t.id}>
              <TD className="font-medium text-slate-900">{t.name}</TD>
              <TD>{yearById.get(t.academic_year_id) ?? "—"}</TD>
            </TR>
          ))}
          {terms.length === 0 && (
            <TR>
              <TD colSpan={2} className="py-8 text-center text-slate-400">
                No exam terms yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
