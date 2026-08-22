import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import * as staffService from "@/features/staff/service";
import type { CreateAdjustmentInput, CreatePayrollRunInput, UpdatePayrollItemInput } from "@/validations/payroll";

export const listPayrollRuns = repo.listPayrollRuns;
export const getPayrollRun = repo.getPayrollRun;
export const listPayrollItems = repo.listPayrollItems;
export const listAdjustmentsForStaff = repo.listAdjustmentsForStaff;

export async function createPayrollRun(supabase: SupabaseClient, input: CreatePayrollRunInput) {
  return repo.insertPayrollRun(supabase, input.month, input.year);
}

/**
 * draft -> calculated: one payroll_item per active staff member, seeded
 * from their basic_salary, with any unapplied payroll_adjustments folded
 * in as bonus (positive) or deductions (negative) and immediately marked
 * applied to this run — this is the loop that makes "corrections go into
 * the next run" actually true, not just a promise.
 */
export async function calculatePayrollRun(supabase: SupabaseClient, runId: string) {
  const [staffList, adjustments] = await Promise.all([
    staffService.listActiveStaff(supabase),
    repo.listUnappliedAdjustments(supabase),
  ]);

  for (const staff of staffList) {
    const staffAdjustments = adjustments.filter((a) => a.staff_id === staff.id);
    const adjustmentTotal = staffAdjustments.reduce((sum, a) => sum + a.amount, 0);

    await repo.insertPayrollItem(supabase, {
      payroll_run_id: runId,
      staff_id: staff.id,
      basic_pay: staff.basic_salary,
      allowances: 0,
      deductions: adjustmentTotal < 0 ? Math.abs(adjustmentTotal) : 0,
      bonus: adjustmentTotal > 0 ? adjustmentTotal : 0,
      leave_deduction: 0,
    });

    for (const adjustment of staffAdjustments) {
      await repo.markAdjustmentApplied(supabase, adjustment.id, runId);
    }
  }

  await repo.advancePayrollStatus(supabase, runId, "calculated");
}

export async function updatePayrollItem(supabase: SupabaseClient, input: UpdatePayrollItemInput) {
  await repo.updatePayrollItem(supabase, input.id, {
    allowances: input.allowances,
    deductions: input.deductions,
    bonus: input.bonus,
    leave_deduction: input.leave_deduction,
  });
}

export const advancePayrollStatus = repo.advancePayrollStatus;

export async function createAdjustment(supabase: SupabaseClient, input: CreateAdjustmentInput) {
  return repo.insertAdjustment(supabase, input);
}
