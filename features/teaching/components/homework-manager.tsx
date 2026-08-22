"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homeworkSchema, type HomeworkInput } from "@/validations/teaching";
import { createHomeworkAction } from "@/features/teaching/actions";
import type { Homework } from "@/types/teaching";
import type { AcademicYear, SchoolClass, Section, Subject } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function HomeworkManager({
  initialHomework: homework,
  classes,
  sections,
  subjects,
  academicYears,
  canCreate,
}: {
  initialHomework: Homework[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkInput>({ resolver: zodResolver(homeworkSchema) });

  const selectedClassId = watch("class_id");
  const filteredSections = sections.filter((s) => s.class_id === selectedClassId);
  const filteredSubjects = subjects.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: HomeworkInput) {
    setError(null);
    const result = await createHomeworkAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({
      academic_year_id: values.academic_year_id,
      class_id: values.class_id,
      section_id: values.section_id,
      subject_id: values.subject_id,
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Assign homework</CardTitle>
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
                  <Label htmlFor="section_id">Section</Label>
                  <select id="section_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("section_id")}>
                    <option value="">Choose</option>
                    {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.section_id && <p className="text-xs text-red-600">{errors.section_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subject_id">Subject</Label>
                  <select id="subject_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("subject_id")}>
                    <option value="">Choose</option>
                    {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.subject_id && <p className="text-xs text-red-600">{errors.subject_id.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="homework_date">Assigned date</Label>
                  <Input id="homework_date" type="date" {...register("homework_date")} />
                  {errors.homework_date && <p className="text-xs text-red-600">{errors.homework_date.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="submission_date">Due date</Label>
                  <Input id="submission_date" type="date" {...register("submission_date")} />
                  {errors.submission_date && <p className="text-xs text-red-600">{errors.submission_date.message}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("description")} />
                {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Assigning…" : "Assign homework"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Assigned</TH>
            <TH>Due</TH>
            <TH>Class</TH>
            <TH>Section</TH>
            <TH>Subject</TH>
            <TH>Description</TH>
          </TR>
        </THead>
        <TBody>
          {homework.map((h) => (
            <TR key={h.id}>
              <TD>{h.homework_date}</TD>
              <TD>{h.submission_date}</TD>
              <TD>{classById.get(h.class_id) ?? "—"}</TD>
              <TD>{sectionById.get(h.section_id) ?? "—"}</TD>
              <TD>{subjectById.get(h.subject_id) ?? "—"}</TD>
              <TD className="max-w-xs truncate">{h.description}</TD>
            </TR>
          ))}
          {homework.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-slate-400">
                No homework assigned yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
