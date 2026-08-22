export type PayrollRunStatus = "draft" | "calculated" | "reviewed" | "approved" | "processed";

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PayrollItem {
  id: string;
  payroll_run_id: string;
  staff_id: string;
  basic_pay: number;
  allowances: number;
  deductions: number;
  bonus: number;
  leave_deduction: number;
  net_salary: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PayrollAdjustment {
  id: string;
  staff_id: string;
  payroll_item_id: string | null;
  amount: number;
  reason: string;
  applied_in_payroll_run_id: string | null;
  created_at: string;
  created_by: string | null;
}
