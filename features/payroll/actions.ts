"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  createAdjustmentSchema,
  createPayrollRunSchema,
  updatePayrollItemSchema,
  type CreateAdjustmentInput,
  type CreatePayrollRunInput,
  type UpdatePayrollItemInput,
} from "@/validations/payroll";
import type { PayrollRunStatus } from "@/types/payroll";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateRunResult = { ok: true; runId: string } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createPayrollRunAction(
  input: CreatePayrollRunInput,
): Promise<CreateRunResult> {
  try {
    await requirePermission("payroll.process");
    const parsed = createPayrollRunSchema.parse(input);
    const supabase = await createClient();
    const run = await service.createPayrollRun(supabase, parsed);
    revalidatePath("/admin/payroll");
    return { ok: true, runId: run.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create payroll run." };
  }
}

export async function calculatePayrollRunAction(runId: string): Promise<ActionResult> {
  try {
    await requirePermission("payroll.process");
    const supabase = await createClient();
    await service.calculatePayrollRun(supabase, runId);
    revalidatePath(`/admin/payroll/${runId}`);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not calculate payroll.");
  }
}

export async function updatePayrollItemAction(
  input: UpdatePayrollItemInput,
): Promise<ActionResult> {
  try {
    await requirePermission("payroll.process");
    const parsed = updatePayrollItemSchema.parse(input);
    const supabase = await createClient();
    await service.updatePayrollItem(supabase, parsed);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not update payroll item.");
  }
}

export async function advancePayrollStatusAction(
  runId: string,
  newStatus: PayrollRunStatus,
): Promise<ActionResult> {
  try {
    // Both process and approve are legitimate actors here — the
    // advance_payroll_status() RPC itself decides which transitions each
    // permission is actually allowed to make, so this action just needs
    // "some payroll capability", not a specific one.
    const canAct = (await hasPermission("payroll.process")) || (await hasPermission("payroll.approve"));
    if (!canAct) throw new Error("Forbidden");
    const supabase = await createClient();
    await service.advancePayrollStatus(supabase, runId, newStatus);
    revalidatePath(`/admin/payroll/${runId}`);
    revalidatePath("/admin/payroll");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not update payroll run status.");
  }
}

export async function createAdjustmentAction(
  input: CreateAdjustmentInput,
): Promise<ActionResult> {
  try {
    await requirePermission("payroll.approve");
    const parsed = createAdjustmentSchema.parse(input);
    const supabase = await createClient();
    await service.createAdjustment(supabase, parsed);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record adjustment.");
  }
}
