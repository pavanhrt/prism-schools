"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gradeScaleSchema, type GradeScaleInput } from "@/validations/exams";
import { createGradeScaleAction, deleteGradeScaleAction } from "@/features/exams/actions";
import type { GradeScale } from "@/types/exams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function GradeScalesManager({
  initialScales: scales,
  canManage,
}: {
  initialScales: GradeScale[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GradeScaleInput>({ resolver: zodResolver(gradeScaleSchema) });

  async function onSubmit(values: GradeScaleInput) {
    setError(null);
    const result = await createGradeScaleAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ grade_name: "", min_percentage: 0, max_percentage: 0, grade_point: 0, description: "" });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteGradeScaleAction(id);
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
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Add grade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grade_name">Grade</Label>
                  <Input id="grade_name" placeholder="A+" {...register("grade_name")} />
                  {errors.grade_name && <p className="text-xs text-red-600">{errors.grade_name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="min_percentage">Min %</Label>
                  <Input id="min_percentage" type="number" {...register("min_percentage")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max_percentage">Max %</Label>
                  <Input id="max_percentage" type="number" {...register("max_percentage")} />
                  {errors.max_percentage && <p className="text-xs text-red-600">{errors.max_percentage.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grade_point">Points</Label>
                  <Input id="grade_point" type="number" step="0.1" {...register("grade_point")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Excellent" {...register("description")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add grade"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Grade</TH>
            <TH>Range</TH>
            <TH>Points</TH>
            <TH>Description</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {scales.map((g) => (
            <TR key={g.id}>
              <TD className="font-medium text-slate-900">{g.grade_name}</TD>
              <TD>{g.min_percentage}–{g.max_percentage}%</TD>
              <TD>{g.grade_point}</TD>
              <TD>{g.description ?? "—"}</TD>
              <TD>
                {canManage && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(g.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {scales.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No grades configured yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
