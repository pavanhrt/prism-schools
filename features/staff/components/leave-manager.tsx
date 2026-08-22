"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, type LeaveRequestInput } from "@/validations/staff";
import { createLeaveRequestAction, decideLeaveRequestAction } from "@/features/staff/actions";
import type { LeaveRequest } from "@/types/staff";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function LeaveManager({
  initialRequests: requests,
  staff,
  canCreate,
  canApprove,
}: {
  initialRequests: LeaveRequest[];
  staff: Staff[];
  canCreate: boolean;
  canApprove: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const staffById = new Map(staff.map((s) => [s.id, s]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { leave_type: "casual" },
  });

  async function onSubmit(values: LeaveRequestInput) {
    setError(null);
    const result = await createLeaveRequestAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ staff_id: "", leave_type: "casual", start_date: "", end_date: "", reason: "" });
    router.refresh();
  }

  function decide(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await decideLeaveRequestAction(id, { status });
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
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Log leave request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="staff_id">Staff member</Label>
                  <select id="staff_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("staff_id")}>
                    <option value="">Choose</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                  {errors.staff_id && <p className="text-xs text-red-600">{errors.staff_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="leave_type">Type</Label>
                  <select id="leave_type" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("leave_type")}>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="earned">Earned</option>
                    <option value="maternity">Maternity</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                  {errors.start_date && <p className="text-xs text-red-600">{errors.start_date.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_date">End date</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                  {errors.end_date && <p className="text-xs text-red-600">{errors.end_date.message}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" {...register("reason")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Logging…" : "Log request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Staff</TH>
            <TH>Type</TH>
            <TH>Dates</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {requests.map((r) => {
            const s = staffById.get(r.staff_id);
            return (
              <TR key={r.id}>
                <TD className="font-medium text-slate-900">{s ? `${s.first_name} ${s.last_name}` : "—"}</TD>
                <TD className="capitalize">{r.leave_type}</TD>
                <TD>{r.start_date} → {r.end_date}</TD>
                <TD>
                  <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "outline" : "warning"}>
                    {r.status}
                  </Badge>
                </TD>
                <TD>
                  {canApprove && r.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" disabled={pending} onClick={() => decide(r.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="destructive" disabled={pending} onClick={() => decide(r.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </TD>
              </TR>
            );
          })}
          {requests.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">No leave requests yet.</TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
