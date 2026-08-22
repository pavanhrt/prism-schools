"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subjectSchema, type SubjectInput } from "@/validations/academic";
import { createSubjectAction, deleteSubjectAction } from "@/features/academics/actions";
import type { Subject, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function SubjectsManager({
  initialSubjects: subjects,
  classes,
  canCreate,
  canDelete,
}: {
  initialSubjects: Subject[];
  classes: SchoolClass[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const classById = new Map(classes.map((c) => [c.id, c.name]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { subject_type: "theory" },
  });

  async function onSubmit(values: SubjectInput) {
    setError(null);
    const result = await createSubjectAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ class_id: values.class_id, name: "", code: "", subject_type: "theory" });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteSubjectAction(id);
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
            <CardTitle>Add subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="class_id">Class</Label>
                <select
                  id="class_id"
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...register("class_id")}
                >
                  <option value="">Choose a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.class_id && (
                  <p className="text-xs text-red-600">{errors.class_id.message}</p>
                )}
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Subject name</Label>
                  <Input id="name" placeholder="Mathematics" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" placeholder="MATH" {...register("code")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject_type">Type</Label>
                <select
                  id="subject_type"
                  className="h-9 w-40 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...register("subject_type")}
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="both">Both</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add subject"}
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
            <TH>Code</TH>
            <TH>Type</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {subjects.map((s) => (
            <TR key={s.id}>
              <TD>{classById.get(s.class_id) ?? "—"}</TD>
              <TD className="font-medium text-slate-900">{s.name}</TD>
              <TD>{s.code ?? "—"}</TD>
              <TD>
                <Badge variant="outline">{s.subject_type}</Badge>
              </TD>
              <TD>
                {canDelete && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => remove(s.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {subjects.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No subjects yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
