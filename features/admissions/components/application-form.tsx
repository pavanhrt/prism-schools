"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/validations/admissions";
import { createApplicationAction } from "@/features/admissions/actions";
import type { AdmissionInquiry } from "@/types/admissions";
import type { AcademicYear, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApplicationForm({
  inquiry,
  classes,
  academicYears,
}: {
  inquiry: AdmissionInquiry;
  classes: SchoolClass[];
  academicYears: AcademicYear[];
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [firstGuess, ...lastGuess] = inquiry.student_name.trim().split(" ");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      inquiry_id: inquiry.id,
      first_name: firstGuess ?? "",
      last_name: lastGuess.join(" "),
      phone: inquiry.phone,
      email: inquiry.email ?? "",
      class_applying_id: inquiry.class_requested_id ?? "",
      academic_year_id: inquiry.academic_year_id ?? "",
    },
  });

  async function onSubmit(values: ApplicationInput) {
    setError(null);
    const result = await createApplicationAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/admissions/applications");
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Application for {inquiry.student_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="hidden" {...register("inquiry_id")} />
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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
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
              <Label htmlFor="previous_school">Previous school</Label>
              <Input id="previous_school" {...register("previous_school")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <textarea id="address" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("address")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class_applying_id">Class applying for</Label>
              <select id="class_applying_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("class_applying_id")}>
                <option value="">Choose a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.class_applying_id && (
                <p className="text-xs text-red-600">{errors.class_applying_id.message}</p>
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
