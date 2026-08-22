"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  teacherAssignmentSchema,
  type TeacherAssignmentInput,
} from "@/validations/teaching";
import {
  createTeacherAssignmentAction,
  deleteTeacherAssignmentAction,
} from "@/features/teaching/actions";
import type { TeacherAssignment } from "@/types/teaching";
import type { AcademicYear, SchoolClass, Section, Subject } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function TeacherAssignmentsManager({
  initialAssignments: assignments,
  teachers,
  classes,
  sections,
  subjects,
  academicYears,
  canManage,
}: {
  initialAssignments: TeacherAssignment[];
  teachers: { id: string; full_name: string }[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  canManage: boolean;
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
  } = useForm<TeacherAssignmentInput>({ resolver: zodResolver(teacherAssignmentSchema) });

  const selectedClassId = watch("class_id");
  const filteredSections = sections.filter((s) => s.class_id === selectedClassId);
  const filteredSubjects = subjects.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: TeacherAssignmentInput) {
    setError(null);
    const result = await createTeacherAssignmentAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ teacher_id: "", academic_year_id: values.academic_year_id, class_id: "", section_id: "", subject_id: "" });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTeacherAssignmentAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Assign a teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <select id="teacher_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("teacher_id")}>
                    <option value="">Choose a teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                  {errors.teacher_id && <p className="text-xs text-red-600">{errors.teacher_id.message}</p>}
                  {teachers.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No users hold the teacher role yet — assign it from Roles &amp; Users first.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="academic_year_id">Academic year</Label>
                  <select id="academic_year_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("academic_year_id")}>
                    <option value="">Choose a year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.year_label}</option>
                    ))}
                  </select>
                  {errors.academic_year_id && (
                    <p className="text-xs text-red-600">{errors.academic_year_id.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="class_id">Class</Label>
                  <select id="class_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("class_id")}>
                    <option value="">Choose a class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.class_id && <p className="text-xs text-red-600">{errors.class_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="section_id">Section</Label>
                  <select id="section_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("section_id")}>
                    <option value="">Choose a section</option>
                    {filteredSections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.section_id && <p className="text-xs text-red-600">{errors.section_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subject_id">Subject</Label>
                  <select id="subject_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("subject_id")}>
                    <option value="">Class teacher (no subject)</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Assigning…" : "Assign"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Teacher</TH>
            <TH>Class</TH>
            <TH>Section</TH>
            <TH>Role</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {assignments.map((a) => (
            <TR key={a.id}>
              <TD className="font-medium text-slate-900">{teacherById.get(a.teacher_id) ?? "—"}</TD>
              <TD>{classById.get(a.class_id) ?? "—"}</TD>
              <TD>{sectionById.get(a.section_id) ?? "—"}</TD>
              <TD>
                {a.subject_id ? (
                  <Badge variant="outline">{subjectById.get(a.subject_id) ?? "subject"}</Badge>
                ) : (
                  <Badge variant="success">class teacher</Badge>
                )}
              </TD>
              <TD>
                {canManage && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(a.id)}>
                      Remove
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {assignments.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No teacher assignments yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
