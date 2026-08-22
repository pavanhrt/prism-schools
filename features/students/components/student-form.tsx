"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput } from "@/validations/students";
import { createStudentAction } from "@/features/students/actions";
import type { AcademicYear, SchoolClass, Section } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StudentForm({
  classes,
  sections,
  academicYears,
}: {
  classes: SchoolClass[];
  sections: Section[];
  academicYears: AcademicYear[];
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({ resolver: zodResolver(studentSchema) });

  const selectedClassId = watch("class_id");
  const filteredSections = sections.filter((s) => s.class_id === selectedClassId);

  async function onSubmit(values: StudentInput) {
    setError(null);
    const result = await createStudentAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/students");
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>New student</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...register("dob")} />
              {errors.dob && <p className="text-xs text-red-600">{errors.dob.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("gender")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="blood_group">Blood group</Label>
              <Input id="blood_group" {...register("blood_group")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="religion">Religion</Label>
              <Input id="religion" {...register("religion")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="father_name">Father&apos;s name</Label>
              <Input id="father_name" {...register("father_name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mother_name">Mother&apos;s name</Label>
              <Input id="mother_name" {...register("mother_name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardian_phone">Guardian phone</Label>
              <Input id="guardian_phone" {...register("guardian_phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <textarea id="address" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("address")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="previous_school">Previous school</Label>
            <Input id="previous_school" {...register("previous_school")} />
          </div>

          <div className="grid grid-cols-4 gap-4 border-t border-slate-200 pt-4">
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
              <Label htmlFor="roll_no">Roll no</Label>
              <Input id="roll_no" {...register("roll_no")} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Creating…" : "Create student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
