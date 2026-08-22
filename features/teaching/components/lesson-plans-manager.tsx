"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonPlanSchema, type LessonPlanInput } from "@/validations/teaching";
import { createLessonPlanAction, updateLessonPlanStatusAction } from "@/features/teaching/actions";
import type { LessonPlan, LessonPlanStatus } from "@/types/teaching";
import type { AcademicYear, SchoolClass, Subject } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<LessonPlanStatus, "default" | "success" | "warning" | "outline"> = {
  pending: "outline",
  in_progress: "warning",
  completed: "success",
};

export function LessonPlansManager({
  initialPlans: plans,
  classes,
  subjects,
  academicYears,
  canCreate,
  canEdit,
}: {
  initialPlans: LessonPlan[];
  classes: SchoolClass[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LessonPlanInput>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: { status: "pending" },
  });

  const selectedClassId = watch("class_id");
  const filteredSubjects = subjects.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: LessonPlanInput) {
    setError(null);
    const result = await createLessonPlanAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({
      academic_year_id: values.academic_year_id,
      class_id: values.class_id,
      subject_id: values.subject_id,
      status: "pending",
    });
    router.refresh();
  }

  function advance(id: string, status: LessonPlanStatus) {
    startTransition(async () => {
      const result = await updateLessonPlanStatusAction(id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New lesson plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="topic_title">Topic</Label>
                  <Input id="topic_title" {...register("topic_title")} />
                  {errors.topic_title && <p className="text-xs text-red-600">{errors.topic_title.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="planned_date">Planned date</Label>
                  <Input id="planned_date" type="date" {...register("planned_date")} />
                  {errors.planned_date && <p className="text-xs text-red-600">{errors.planned_date.message}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("description")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add lesson plan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Class</TH>
            <TH>Subject</TH>
            <TH>Topic</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {plans.map((p) => (
            <TR key={p.id}>
              <TD>{p.planned_date}</TD>
              <TD>{classById.get(p.class_id) ?? "—"}</TD>
              <TD>{subjectById.get(p.subject_id) ?? "—"}</TD>
              <TD className="font-medium text-slate-900">{p.topic_title}</TD>
              <TD>
                <Badge variant={STATUS_VARIANT[p.status]}>{p.status.replace("_", " ")}</Badge>
              </TD>
              <TD>
                {canEdit && p.status !== "completed" && (
                  <div className="flex justify-end gap-2">
                    {p.status === "pending" && (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(p.id, "in_progress")}>
                        Start
                      </Button>
                    )}
                    <Button size="sm" disabled={pending} onClick={() => advance(p.id, "completed")}>
                      Complete
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {plans.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-slate-400">
                No lesson plans yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
