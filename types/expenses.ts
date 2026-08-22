export type ExpensePaymentMode = "cash" | "upi" | "bank_transfer" | "cheque";

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Expense {
  id: string;
  expense_no: string;
  category_id: string;
  amount: number;
  expense_date: string;
  description: string | null;
  paid_to: string | null;
  payment_mode: ExpensePaymentMode;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
