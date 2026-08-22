export type FeeFrequency = "monthly" | "quarterly" | "annually" | "one_time";

export interface FeeType {
  id: string;
  name: string;
  frequency: FeeFrequency;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface FeeStructure {
  id: string;
  academic_year_id: string;
  class_id: string;
  fee_type_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface FeeInvoice {
  id: string;
  student_id: string;
  academic_year_id: string;
  invoice_no: string;
  due_date: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface FeeInvoiceItem {
  id: string;
  invoice_id: string;
  fee_type_id: string;
  amount: number;
  created_at: string;
}

export type PaymentMode = "cash" | "upi" | "bank_transfer" | "cheque" | "razorpay";
export type PaymentStatus = "verified" | "voided";

export interface FeePayment {
  id: string;
  invoice_id: string;
  receipt_no: string;
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  transaction_ref: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  note: string | null;
  status: PaymentStatus;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  created_by: string | null;
}

/** Never persisted — always computed from an invoice's payments. */
export type InvoiceStatus = "unpaid" | "partial" | "paid";

export interface InvoiceBalance {
  invoice: FeeInvoice;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
}
