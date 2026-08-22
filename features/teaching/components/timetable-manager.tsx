"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timetableSchema, type TimetableInput } from "@/validations/teaching";
import { createTimetableEntryAction, deleteTimetableEntryAction } from "@/features/teaching/actions";
import type { Timetable } from "@/types/teaching";
import type { AcademicYear, SchoolClass, Section, Subject } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export function TimetableManager({
  initialEntries: entries,
  teachers,
  classes,
  sections,
  subjects,
  academicYears,
  canCreate,
  canDelete,
}: {
  initialEntries: Timetable[];
  teachers: { id: string; full_name: string }[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const teacherById = new Map(teachers.map((t) => [t.id, t.full_name]));
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimetableInput>({ resolver: zodResolver(timetableSchema) });

  const selectedClassId = watch("class_id");
  const filteredSections = sections.filter((s) => s.class_id === selectedClassId);
  const filteredSubjects = subjects.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: TimetableInput) {
    setError(null);
    const result = await createTimetableEntryAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ academic_year_id: values.academic_year_id, class_id: values.class_id, section_id: values.section_id });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTimetableEntryAction(id);
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
            <CardTitle>Add period</CardTitle>
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
              <div className="grid grid-cols-5 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <select id="teacher_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("teacher_id")}>
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="day_of_week">Day</Label>
                  <select id="day_of_week" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("day_of_week")}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_time">Start</Label>
                  <Input id="start_time" type="time" {...register("start_time")} />
                  {errors.start_time && <p className="text-xs text-red-600">{errors.start_time.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_time">End</Label>
                  <Input id="end_time" type="time" {...register("end_time")} />
                  {errors.end_time && <p className="text-xs text-red-600">{errors.end_time.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="room_no">Room</Label>
                  <Input id="room_no" {...register("room_no")} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add period"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Day</TH>
            <TH>Time</TH>
            <TH>Class</TH>
            <TH>Section</TH>
            <TH>Subject</TH>
            <TH>Teacher</TH>
            <TH>Room</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {entries.map((e) => (
            <TR key={e.id}>
              <TD className="capitalize">{e.day_of_week}</TD>
              <TD>{e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}</TD>
              <TD>{classById.get(e.class_id) ?? "—"}</TD>
              <TD>{sectionById.get(e.section_id) ?? "—"}</TD>
              <TD>{subjectById.get(e.subject_id) ?? "—"}</TD>
              <TD>{e.teacher_id ? teacherById.get(e.teacher_id) ?? "—" : "—"}</TD>
              <TD>{e.room_no ?? "—"}</TD>
              <TD>
                {canDelete && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(e.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {entries.length === 0 && (
            <TR>
              <TD colSpan={8} className="py-8 text-center text-slate-400">
                No timetable entries yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
