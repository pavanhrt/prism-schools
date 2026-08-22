"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffSchema, type StaffInput } from "@/validations/staff";
import { createStaffAction } from "@/features/staff/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: { date_of_joining: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: StaffInput) {
    setError(null);
    const result = await createStaffAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/staff");
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>New staff member</CardTitle>
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
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("gender")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emergency_contact">Emergency contact</Label>
              <Input id="emergency_contact" {...register("emergency_contact")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...register("dob")} />
              {errors.dob && <p className="text-xs text-red-600">{errors.dob.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date_of_joining">Joining date</Label>
              <Input id="date_of_joining" type="date" {...register("date_of_joining")} />
              {errors.date_of_joining && <p className="text-xs text-red-600">{errors.date_of_joining.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="blood_group">Blood group</Label>
              <Input id="blood_group" {...register("blood_group")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" placeholder="Teacher" {...register("designation")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="Academics" {...register("department")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="basic_salary">Basic salary</Label>
              <Input id="basic_salary" type="number" step="0.01" {...register("basic_salary")} />
              {errors.basic_salary && <p className="text-xs text-red-600">{errors.basic_salary.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qualification">Qualification</Label>
            <Input id="qualification" {...register("qualification")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <textarea id="address" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("address")} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Creating…" : "Create staff record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
