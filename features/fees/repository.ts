import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FeeInvoice,
  FeeInvoiceItem,
  FeePayment,
  FeeStructure,
  FeeType,
} from "@/types/fees";

// ---- Fee types ---------------------------------------------------------------

export async function listFeeTypes(supabase: SupabaseClient): Promise<FeeType[]> {
  const { data, error } = await supabase.from("fee_types").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertFeeType(
  supabase: SupabaseClient,
  input: Pick<FeeType, "name" | "frequency" | "description">,
): Promise<FeeType> {
  const { data, error } = await supabase.from("fee_types").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Fee structures ------------------------------------------------------------

export async function listFeeStructures(supabase: SupabaseClient): Promise<FeeStructure[]> {
  const { data, error } = await supabase.from("fee_structures").select("*");
  if (error) throw error;
  return data;
}

export async function insertFeeStructure(
  supabase: SupabaseClient,
  input: Pick<FeeStructure, "academic_year_id" | "class_id" | "fee_type_id" | "amount">,
): Promise<FeeStructure> {
  const { data, error } = await supabase.from("fee_structures").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Invoices --------------------------------------------------------------

export async function listInvoices(supabase: SupabaseClient): Promise<FeeInvoice[]> {
  const { data, error } = await supabase
    .from("fee_invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Filtered by academic year (and optionally a due-date range) at the
 * database level — Management Intelligence's Fee dashboard scopes to one
 * year by default and should never pull every historical invoice to do it. */
export async function listInvoicesForYear(
  supabase: SupabaseClient,
  academicYearId: string,
  dueDateFrom?: string,
  dueDateTo?: string,
): Promise<FeeInvoice[]> {
  let query = supabase.from("fee_invoices").select("*").eq("academic_year_id", academicYearId).order("created_at", { ascending: false });
  if (dueDateFrom) query = query.gte("due_date", dueDateFrom);
  if (dueDateTo) query = query.lte("due_date", dueDateTo);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getInvoice(
  supabase: SupabaseClient,
  id: string,
): Promise<FeeInvoice | null> {
  const { data, error } = await supabase.from("fee_invoices").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export type NewInvoice = Pick<FeeInvoice, "student_id" | "academic_year_id" | "due_date" | "total_amount">;

export async function insertInvoice(
  supabase: SupabaseClient,
  input: NewInvoice,
): Promise<FeeInvoice> {
  const { data, error } = await supabase.from("fee_invoices").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function insertInvoiceItems(
  supabase: SupabaseClient,
  items: Pick<FeeInvoiceItem, "invoice_id" | "fee_type_id" | "amount">[],
): Promise<void> {
  const { error } = await supabase.from("fee_invoice_items").insert(items);
  if (error) throw error;
}

export async function listInvoiceItems(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<FeeInvoiceItem[]> {
  const { data, error } = await supabase
    .from("fee_invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId);
  if (error) throw error;
  return data;
}

/** Bulk read across every invoice's line items — used by Management
 * Intelligence for fee-type collection analytics without an N+1 fetch. */
export async function listAllInvoiceItems(supabase: SupabaseClient): Promise<FeeInvoiceItem[]> {
  const { data, error } = await supabase.from("fee_invoice_items").select("*");
  if (error) throw error;
  return data;
}

/** Bulk read scoped to a known set of invoices — avoids fetching every
 * historical invoice item just to compute one year's fee-type breakdown. */
export async function listInvoiceItemsForInvoices(supabase: SupabaseClient, invoiceIds: string[]): Promise<FeeInvoiceItem[]> {
  if (invoiceIds.length === 0) return [];
  const { data, error } = await supabase.from("fee_invoice_items").select("*").in("invoice_id", invoiceIds);
  if (error) throw error;
  return data;
}

// ---- Payments ----------------------------------------------------------------

export async function listPaymentsForInvoices(supabase: SupabaseClient, invoiceIds: string[]): Promise<FeePayment[]> {
  if (invoiceIds.length === 0) return [];
  const { data, error } = await supabase.from("fee_payments").select("*").in("invoice_id", invoiceIds);
  if (error) throw error;
  return data;
}

export async function listAllPayments(supabase: SupabaseClient): Promise<FeePayment[]> {
  const { data, error } = await supabase
    .from("fee_payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPayment(
  supabase: SupabaseClient,
  id: string,
): Promise<FeePayment | null> {
  const { data, error } = await supabase.from("fee_payments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listPaymentsForInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<FeePayment[]> {
  const { data, error } = await supabase
    .from("fee_payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewPayment = Pick<
  FeePayment,
  "invoice_id" | "amount" | "payment_date" | "payment_mode" | "transaction_ref" | "note"
>;

export async function insertPayment(
  supabase: SupabaseClient,
  input: NewPayment,
): Promise<FeePayment> {
  const { data, error } = await supabase.from("fee_payments").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function voidPayment(
  supabase: SupabaseClient,
  paymentId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc("void_fee_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });
  if (error) throw error;
}
