import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// calculatePayrollRun is the loop that makes "corrections go into the next
// run" (blueprint's payroll integrity rule) actually true: unapplied
// payroll_adjustments must be folded into the new items as bonus/deduction
// by sign, and marked applied so they're never double-counted.

vi.mock("@/features/payroll/repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/payroll/repository")>();
  return {
    ...actual,
    listUnappliedAdjustments: vi.fn(),
    insertPayrollItem: vi.fn(),
    markAdjustmentApplied: vi.fn(),
    advancePayrollStatus: vi.fn(),
  };
});

vi.mock("@/features/staff/service", async () => ({
  listActiveStaff: vi.fn(),
}));

import { calculatePayrollRun } from "@/features/payroll/service";
import * as repo from "@/features/payroll/repository";
import * as staffService from "@/features/staff/service";

const supabase = {} as SupabaseClient;

describe("calculatePayrollRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("folds a positive unapplied adjustment in as a bonus, and marks it applied", async () => {
    vi.mocked(staffService.listActiveStaff).mockResolvedValue([
      { id: "staff-1", basic_salary: 30000 } as never,
    ]);
    vi.mocked(repo.listUnappliedAdjustments).mockResolvedValue([
      { id: "adj-1", staff_id: "staff-1", amount: 2000, reason: "arrears", applied_in_payroll_run_id: null } as never,
    ]);

    await calculatePayrollRun(supabase, "run-1");

    expect(repo.insertPayrollItem).toHaveBeenCalledWith(supabase, {
      payroll_run_id: "run-1",
      staff_id: "staff-1",
      basic_pay: 30000,
      allowances: 0,
      deductions: 0,
      bonus: 2000,
      leave_deduction: 0,
    });
    expect(repo.markAdjustmentApplied).toHaveBeenCalledWith(supabase, "adj-1", "run-1");
    expect(repo.advancePayrollStatus).toHaveBeenCalledWith(supabase, "run-1", "calculated");
  });

  it("folds a negative unapplied adjustment in as a deduction, using its absolute value", async () => {
    vi.mocked(staffService.listActiveStaff).mockResolvedValue([
      { id: "staff-1", basic_salary: 30000 } as never,
    ]);
    vi.mocked(repo.listUnappliedAdjustments).mockResolvedValue([
      { id: "adj-1", staff_id: "staff-1", amount: -1500, reason: "recovery", applied_in_payroll_run_id: null } as never,
    ]);

    await calculatePayrollRun(supabase, "run-1");

    expect(repo.insertPayrollItem).toHaveBeenCalledWith(supabase, expect.objectContaining({
      deductions: 1500,
      bonus: 0,
    }));
  });

  it("never applies an adjustment belonging to a different staff member", async () => {
    vi.mocked(staffService.listActiveStaff).mockResolvedValue([
      { id: "staff-1", basic_salary: 30000 } as never,
    ]);
    vi.mocked(repo.listUnappliedAdjustments).mockResolvedValue([
      { id: "adj-1", staff_id: "staff-2", amount: 500, reason: "unrelated", applied_in_payroll_run_id: null } as never,
    ]);

    await calculatePayrollRun(supabase, "run-1");

    expect(repo.insertPayrollItem).toHaveBeenCalledWith(supabase, expect.objectContaining({
      bonus: 0,
      deductions: 0,
    }));
    expect(repo.markAdjustmentApplied).not.toHaveBeenCalled();
  });
});
