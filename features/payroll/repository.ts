import type { SupabaseClient } from "@supabase/supabase-js";
import type { PayrollAdjustment, PayrollItem, PayrollRun, PayrollRunStatus } from "@/types/payroll";

// ---- Runs --------------------------------------------------------------------

export async function listPayrollRuns(supabase: SupabaseClient): Promise<PayrollRun[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPayrollRun(
  supabase: SupabaseClient,
  id: string,
): Promise<PayrollRun | null> {
  const { data, error } = await supabase.from("payroll_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertPayrollRun(
  supabase: SupabaseClient,
  month: number,
  year: number,
): Promise<PayrollRun> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .insert({ month, year })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function advancePayrollStatus(
  supabase: SupabaseClient,
  runId: string,
  newStatus: PayrollRunStatus,
): Promise<void> {
  const { error } = await supabase.rpc("advance_payroll_status", {
    p_run_id: runId,
    p_new_status: newStatus,
  });
  if (error) throw error;
}

// ---- Items -------------------------------------------------------------------

export async function listPayrollItems(
  supabase: SupabaseClient,
  runId: string,
): Promise<PayrollItem[]> {
  const { data, error } = await supabase
    .from("payroll_items")
    .select("*")
    .eq("payroll_run_id", runId);
  if (error) throw error;
  return data;
}

export type NewPayrollItem = Pick<
  PayrollItem,
  "payroll_run_id" | "staff_id" | "basic_pay" | "allowances" | "deductions" | "bonus" | "leave_deduction"
>;

export async function insertPayrollItem(
  supabase: SupabaseClient,
  input: NewPayrollItem,
): Promise<PayrollItem> {
  const { data, error } = await supabase.from("payroll_items").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updatePayrollItem(
  supabase: SupabaseClient,
  id: string,
  patch: { allowances: number; deductions: number; bonus: number; leave_deduction: number },
): Promise<void> {
  const { error } = await supabase.from("payroll_items").update(patch).eq("id", id);
  if (error) throw error;
}

// ---- Adjustments ------------------------------------------------------------

export async function listUnappliedAdjustments(
  supabase: SupabaseClient,
): Promise<PayrollAdjustment[]> {
  const { data, error } = await supabase
    .from("payroll_adjustments")
    .select("*")
    .is("applied_in_payroll_run_id", null);
  if (error) throw error;
  return data;
}

export async function listAdjustmentsForStaff(
  supabase: SupabaseClient,
  staffId: string,
): Promise<PayrollAdjustment[]> {
  const { data, error } = await supabase
    .from("payroll_adjustments")
    .select("*")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertAdjustment(
  supabase: SupabaseClient,
  input: { staff_id: string; amount: number; reason: string },
): Promise<PayrollAdjustment> {
  const { data, error } = await supabase.from("payroll_adjustments").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function markAdjustmentApplied(
  supabase: SupabaseClient,
  id: string,
  runId: string,
): Promise<void> {
  const { error } = await supabase
    .from("payroll_adjustments")
    .update({ applied_in_payroll_run_id: runId })
    .eq("id", id);
  if (error) throw error;
}
