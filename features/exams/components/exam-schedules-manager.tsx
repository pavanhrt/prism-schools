"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { examScheduleSchema, type ExamScheduleInput } from "@/validations/exams";
import { advanceResultStatusAction, createExamScheduleAction } from "@/features/exams/actions";
import type { ExamSchedule, ResultStatus } from "@/types/exams";
import type { SchoolClass, Subject } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<ResultStatus, "default" | "success" | "warning" | "outline"> = {
  draft: "outline",
  submitted: "warning",
  approved: "warning",
  published: "success",
  locked: "default",
};

const NEXT_STEP: Partial<Record<ResultStatus, { label: string; target: ResultStatus }>> = {
  submitted: { label: "Approve", target: "approved" },
  approved: { label: "Publish", target: "published" },
  published: { label: "Lock", target: "locked" },
};

export function ExamSchedulesManager({
  examId,
  initialSchedules: schedules,
  classes,
  subjects,
  canCreate,
  canPublish,
}: {
  examId: string;
  initialSchedules: ExamSchedule[];
  classes: SchoolClass[];
  subjects: Subject[];
  canCreate: boolean;
  canPublish: boolean;
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
  } = useForm<ExamScheduleInput>({
    resolver: zodResolver(examScheduleSchema),
    defaultValues: { exam_id: examId, max_marks_theory: 80, max_marks_practical: 0, pass_marks: 33 },
  });

  const selectedClassId = watch("class_id");
  const filteredSubjects = subjects.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: ExamScheduleInput) {
    setError(null);
    const result = await createExamScheduleAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ exam_id: examId, class_id: values.class_id, max_marks_theory: 80, max_marks_practical: 0, pass_marks: 33 });
    router.refresh();
  }

  function advance(scheduleId: string, target: ResultStatus) {
    startTransition(async () => {
      const result = await advanceResultStatusAction(scheduleId, target);
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
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Add schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <input type="hidden" {...register("exam_id")} />
              <div className="grid grid-cols-3 gap-4">
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
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="exam_date">Date</Label>
                  <Input id="exam_date" type="date" {...register("exam_date")} />
                  {errors.exam_date && <p className="text-xs text-red-600">{errors.exam_date.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_time">Start time</Label>
                  <Input id="start_time" type="time" {...register("start_time")} />
                  {errors.start_time && <p className="text-xs text-red-600">{errors.start_time.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_time">End time</Label>
                  <Input id="end_time" type="time" {...register("end_time")} />
                  {errors.end_time && <p className="text-xs text-red-600">{errors.end_time.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="room_no">Room</Label>
                  <Input id="room_no" {...register("room_no")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max_marks_theory">Max marks (theory)</Label>
                  <Input id="max_marks_theory" type="number" {...register("max_marks_theory")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max_marks_practical">Max marks (practical)</Label>
                  <Input id="max_marks_practical" type="number" {...register("max_marks_practical")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pass_marks">Pass marks</Label>
                  <Input id="pass_marks" type="number" {...register("pass_marks")} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add schedule"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Class</TH>
            <TH>Subject</TH>
            <TH>Date</TH>
            <TH>Max marks</TH>
            <TH>Result status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {schedules.map((s) => {
            const next = NEXT_STEP[s.result_status];
            return (
              <TR key={s.id}>
                <TD>{classById.get(s.class_id) ?? "—"}</TD>
                <TD>{subjectById.get(s.subject_id) ?? "—"}</TD>
                <TD>{s.exam_date}</TD>
                <TD>{s.max_marks_theory + s.max_marks_practical}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[s.result_status]}>{s.result_status}</Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/exams/schedules/${s.id}/marks`} className="text-sm text-slate-600 underline">
                      Marks
                    </Link>
                    {canPublish && next && (
                      <Button size="sm" disabled={pending} onClick={() => advance(s.id, next.target)}>
                        {next.label}
                      </Button>
                    )}
                    {canPublish && s.result_status === "submitted" && (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(s.id, "draft")}>
                        Send back
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            );
          })}
          {schedules.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-slate-400">
                No schedules yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
