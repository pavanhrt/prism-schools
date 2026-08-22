"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feeTypeSchema, type FeeTypeInput } from "@/validations/fees";
import { createFeeTypeAction } from "@/features/fees/actions";
import type { FeeType } from "@/types/fees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function FeeTypesManager({
  initialTypes: types,
  canManage,
}: {
  initialTypes: FeeType[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeeTypeInput>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: { frequency: "monthly" },
  });

  async function onSubmit(values: FeeTypeInput) {
    setError(null);
    const result = await createFeeTypeAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ name: "", frequency: "monthly", description: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add fee type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Tuition Fee" {...register("name")} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frequency">Frequency</Label>
                <select id="frequency" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("frequency")}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add fee type"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Frequency</TH>
            <TH>Description</TH>
          </TR>
        </THead>
        <TBody>
          {types.map((t) => (
            <TR key={t.id}>
              <TD className="font-medium text-slate-900">{t.name}</TD>
              <TD><Badge variant="outline">{t.frequency.replace("_", "-")}</Badge></TD>
              <TD>{t.description ?? "—"}</TD>
            </TR>
          ))}
          {types.length === 0 && (
            <TR>
              <TD colSpan={3} className="py-8 text-center text-slate-400">
                No fee types yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
