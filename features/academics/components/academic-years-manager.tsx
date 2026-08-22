"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { academicYearSchema, type AcademicYearInput } from "@/validations/academic";
import {
  createAcademicYearAction,
  deleteAcademicYearAction,
  setCurrentAcademicYearAction,
} from "@/features/academics/actions";
import type { AcademicYear } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

// `years` is rendered straight from the server component's props, not
// copied into local state — every mutation below calls router.refresh()
// (or relies on the Server Action's revalidatePath doing it automatically)
// so the parent re-fetches and this component just re-renders with the
// new props. Avoids the useEffect+setState "sync props to state" anti-pattern.
export function AcademicYearsManager({
  initialYears: years,
  canCreate,
  canEdit,
  canDelete,
}: {
  initialYears: AcademicYear[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademicYearInput>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { is_current: false },
  });

  async function onSubmit(values: AcademicYearInput) {
    setError(null);
    const result = await createAcademicYearAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ year_label: "", start_date: "", end_date: "", is_current: false });
    router.refresh();
  }

  function setCurrent(id: string) {
    startTransition(async () => {
      const result = await setCurrentAcademicYearAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAcademicYearAction(id);
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
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Add academic year</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year_label">Year label</Label>
                <Input id="year_label" placeholder="2026-27" {...register("year_label")} />
                {errors.year_label && (
                  <p className="text-xs text-red-600">{errors.year_label.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                  {errors.start_date && (
                    <p className="text-xs text-red-600">{errors.start_date.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_date">End date</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                  {errors.end_date && (
                    <p className="text-xs text-red-600">{errors.end_date.message}</p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register("is_current")} />
                Make this the current academic year
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add academic year"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Year</TH>
            <TH>Start</TH>
            <TH>End</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {years.map((year) => (
            <TR key={year.id}>
              <TD className="font-medium text-slate-900">{year.year_label}</TD>
              <TD>{year.start_date}</TD>
              <TD>{year.end_date}</TD>
              <TD>
                {year.is_current ? (
                  <Badge variant="success">current</Badge>
                ) : (
                  <Badge variant="outline">inactive</Badge>
                )}
              </TD>
              <TD>
                <div className="flex justify-end gap-2">
                  {canEdit && !year.is_current && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setCurrent(year.id)}
                    >
                      Set current
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => remove(year.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </TD>
            </TR>
          ))}
          {years.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No academic years yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
