"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, type ClassInput } from "@/validations/academic";
import { createClassAction, deleteClassAction } from "@/features/academics/actions";
import type { SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function ClassesManager({
  initialClasses: classes,
  nextSequence,
  canCreate,
  canDelete,
}: {
  initialClasses: SchoolClass[];
  nextSequence: number;
  canCreate: boolean;
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
  } = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: { sequence: nextSequence },
  });

  async function onSubmit(values: ClassInput) {
    setError(null);
    const result = await createClassAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ name: "", sequence: nextSequence + 1 });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteClassAction(id);
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
            <CardTitle>Add class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-[1fr_140px] gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Class name</Label>
                  <Input id="name" placeholder="Class 5" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sequence">Sort order</Label>
                  <Input id="sequence" type="number" {...register("sequence")} />
                  {errors.sequence && (
                    <p className="text-xs text-red-600">{errors.sequence.message}</p>
                  )}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add class"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Sort</TH>
            <TH>Class</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {classes.map((c) => (
            <TR key={c.id}>
              <TD>{c.sequence}</TD>
              <TD className="font-medium text-slate-900">{c.name}</TD>
              <TD>
                {canDelete && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => remove(c.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
          {classes.length === 0 && (
            <TR>
              <TD colSpan={3} className="py-8 text-center text-slate-400">
                No classes yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
