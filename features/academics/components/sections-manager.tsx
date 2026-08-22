"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sectionSchema, type SectionInput } from "@/validations/academic";
import { createSectionAction, deleteSectionAction } from "@/features/academics/actions";
import type { Section, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function SectionsManager({
  initialSections: sections,
  classes,
  canCreate,
  canDelete,
}: {
  initialSections: Section[];
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
  } = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { capacity: 40 },
  });

  async function onSubmit(values: SectionInput) {
    setError(null);
    const result = await createSectionAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ class_id: values.class_id, name: "", capacity: 40 });
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteSectionAction(id);
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
            <CardTitle>Add section</CardTitle>
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
              <div className="grid grid-cols-[1fr_140px] gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Section name</Label>
                  <Input id="name" placeholder="A" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" {...register("capacity")} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add section"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Class</TH>
            <TH>Section</TH>
            <TH>Capacity</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {sections.map((s) => (
            <TR key={s.id}>
              <TD>{classById.get(s.class_id) ?? "—"}</TD>
              <TD className="font-medium text-slate-900">{s.name}</TD>
              <TD>{s.capacity}</TD>
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
          {sections.length === 0 && (
            <TR>
              <TD colSpan={4} className="py-8 text-center text-slate-400">
                No sections yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
