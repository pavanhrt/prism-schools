"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  advancePayrollStatusAction,
  calculatePayrollRunAction,
  updatePayrollItemAction,
} from "@/features/payroll/actions";
import type { PayrollItem, PayrollRunStatus } from "@/types/payroll";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function PayrollRunDetail({
  runId,
  status,
  items,
  staffById,
  canProcess,
  canApprove,
}: {
  runId: string;
  status: PayrollRunStatus;
  items: PayrollItem[];
  staffById: Map<string, Staff>;
  canProcess: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editable = (status === "draft" || status === "calculated") && canProcess;

  function calculate() {
    startTransition(async () => {
      const result = await calculatePayrollRunAction(runId);
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  }

  function advance(newStatus: PayrollRunStatus) {
    startTransition(async () => {
      const result = await advancePayrollStatusAction(runId, newStatus);
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  }

  function saveItem(item: PayrollItem, patch: Partial<Pick<PayrollItem, "allowances" | "deductions" | "bonus" | "leave_deduction">>) {
    startTransition(async () => {
      const result = await updatePayrollItemAction({
        id: item.id,
        allowances: patch.allowances ?? item.allowances,
        deductions: patch.deductions ?? item.deductions,
        bonus: patch.bonus ?? item.bonus,
        leave_deduction: patch.leave_deduction ?? item.leave_deduction,
      });
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  }

  const totalNet = items.reduce((sum, i) => sum + i.net_salary, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Status: <Badge variant="outline">{status}</Badge></CardTitle>
          <div className="flex gap-2">
            {status === "draft" && canProcess && (
              <Button size="sm" disabled={pending} onClick={calculate}>Calculate</Button>
            )}
            {status === "calculated" && canProcess && (
              <>
                <Button size="sm" disabled={pending} onClick={() => advance("reviewed")}>Submit for review</Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => advance("draft")}>Send back to draft</Button>
              </>
            )}
            {status === "reviewed" && canApprove && (
              <>
                <Button size="sm" disabled={pending} onClick={() => advance("approved")}>Approve</Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => advance("draft")}>Send back to draft</Button>
              </>
            )}
            {status === "approved" && canApprove && (
              <Button size="sm" disabled={pending} onClick={() => advance("processed")}>Process</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <p className="text-sm text-slate-500">
            Total net salary: <span className="font-medium text-slate-900">₹{totalNet.toFixed(2)}</span>
          </p>
        </CardContent>
      </Card>

      <Table>
        <THead>
          <TR>
            <TH>Staff</TH>
            <TH className="text-right">Basic</TH>
            <TH className="text-right">Allowances</TH>
            <TH className="text-right">Deductions</TH>
            <TH className="text-right">Bonus</TH>
            <TH className="text-right">Leave ded.</TH>
            <TH className="text-right">Net</TH>
          </TR>
        </THead>
        <TBody>
          {items.map((item) => {
            const staff = staffById.get(item.staff_id);
            return (
              <TR key={item.id}>
                <TD className="font-medium text-slate-900">{staff ? `${staff.first_name} ${staff.last_name}` : "—"}</TD>
                <TD className="text-right">₹{item.basic_pay.toFixed(2)}</TD>
                <TD className="text-right">
                  {editable ? (
                    <Input type="number" step="0.01" defaultValue={item.allowances} className="w-24 text-right"
                      onBlur={(e) => saveItem(item, { allowances: Number(e.target.value) })} />
                  ) : `₹${item.allowances.toFixed(2)}`}
                </TD>
                <TD className="text-right">
                  {editable ? (
                    <Input type="number" step="0.01" defaultValue={item.deductions} className="w-24 text-right"
                      onBlur={(e) => saveItem(item, { deductions: Number(e.target.value) })} />
                  ) : `₹${item.deductions.toFixed(2)}`}
                </TD>
                <TD className="text-right">
                  {editable ? (
                    <Input type="number" step="0.01" defaultValue={item.bonus} className="w-24 text-right"
                      onBlur={(e) => saveItem(item, { bonus: Number(e.target.value) })} />
                  ) : `₹${item.bonus.toFixed(2)}`}
                </TD>
                <TD className="text-right">
                  {editable ? (
                    <Input type="number" step="0.01" defaultValue={item.leave_deduction} className="w-24 text-right"
                      onBlur={(e) => saveItem(item, { leave_deduction: Number(e.target.value) })} />
                  ) : `₹${item.leave_deduction.toFixed(2)}`}
                </TD>
                <TD className="text-right font-medium text-slate-900">₹{item.net_salary.toFixed(2)}</TD>
              </TR>
            );
          })}
          {items.length === 0 && (
            <TR>
              <TD colSpan={7} className="py-8 text-center text-slate-400">
                No items yet — click Calculate to generate one per active staff member.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
