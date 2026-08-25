"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { examSchema, type ExamInput } from "@/validations/exams";
import { createExamAction } from "@/features/exams/actions";
import type { Exam, ExamTerm } from "@/types/exams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function ExamsManager({
  initialExams: exams,
  terms,
  canCreate,
}: {
  initialExams: Exam[];
  terms: ExamTerm[];
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const termById = new Map(terms.map((t) => [t.id, t.name]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamInput>({ resolver: zodResolver(examSchema) });

  async function onSubmit(values: ExamInput) {
    setError(null);
    const result = await createExamAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ term_id: values.term_id, name: "", description: "", comparison_group: values.comparison_group, sequence_no: undefined });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add exam</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="term_id">Term</Label>
                <select id="term_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("term_id")}>
                  <option value="">Choose</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.term_id && <p className="text-xs text-red-600">{errors.term_id.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Exam name</Label>
                <Input id="name" placeholder="Mid-Term Examination" {...register("name")} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("description")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comparison_group">Comparison group (optional)</Label>
                <Input id="comparison_group" placeholder="e.g. Term Exams" {...register("comparison_group")} />
                <p className="text-xs text-slate-500">
                  Exams sharing the same comparison group and an ordered sequence number are the only exams Management Intelligence will ever
                  compare for a performance trend. Leave blank to keep this exam out of automatic trend comparisons.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sequence_no">Sequence within group (optional)</Label>
                <Input id="sequence_no" type="number" min={1} step={1} placeholder="e.g. 1, 2, 3" {...register("sequence_no")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add exam"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Exam</TH>
            <TH>Term</TH>
            <TH>Status</TH>
            <TH>Comparison group</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {exams.map((e) => (
            <TR key={e.id}>
              <TD className="font-medium text-slate-900">{e.name}</TD>
              <TD>{termById.get(e.term_id) ?? "—"}</TD>
              <TD>
                <Badge variant="outline">{e.status}</Badge>
              </TD>
              <TD className="text-sm text-slate-600">{e.comparison_group ? `${e.comparison_group} · #${e.sequence_no ?? "—"}` : <span className="text-slate-400">Not comparable</span>}</TD>
              <TD>
                <Link href={`/admin/exams/${e.id}`} className="text-sm text-slate-600 underline">
                  Manage schedules
                </Link>
              </TD>
            </TR>
          ))}
          {exams.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No exams yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
