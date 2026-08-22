"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { createRazorpayOrder } from "@/lib/razorpay/client";
import * as service from "./service";
import { computeInvoiceBalance } from "./balance";
import {
  bulkGenerateInvoicesSchema,
  collectPaymentSchema,
  feeStructureSchema,
  feeTypeSchema,
  generateInvoiceSchema,
  voidPaymentSchema,
  type BulkGenerateInvoicesInput,
  type CollectPaymentInput,
  type FeeStructureInput,
  type FeeTypeInput,
  type GenerateInvoiceInput,
  type VoidPaymentInput,
} from "@/validations/fees";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createFeeTypeAction(input: FeeTypeInput): Promise<ActionResult> {
  try {
    await requirePermission("fees.manage_structure");
    const parsed = feeTypeSchema.parse(input);
    const supabase = await createClient();
    await service.createFeeType(supabase, parsed);
    revalidatePath("/admin/fees/types");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create fee type.");
  }
}

export async function createFeeStructureAction(
  input: FeeStructureInput,
): Promise<ActionResult> {
  try {
    await requirePermission("fees.manage_structure");
    const parsed = feeStructureSchema.parse(input);
    const supabase = await createClient();
    await service.createFeeStructure(supabase, parsed);
    revalidatePath("/admin/fees/structures");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create fee structure.");
  }
}

export async function generateInvoiceAction(
  input: GenerateInvoiceInput,
): Promise<ActionResult> {
  try {
    await requirePermission("fees.create");
    const parsed = generateInvoiceSchema.parse(input);
    const supabase = await createClient();
    await service.generateInvoice(supabase, parsed);
    revalidatePath("/admin/fees/invoices");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not generate invoice.");
  }
}

export async function bulkGenerateInvoicesAction(
  input: BulkGenerateInvoicesInput,
): Promise<ActionResult> {
  try {
    await requirePermission("fees.create");
    const parsed = bulkGenerateInvoicesSchema.parse(input);
    const supabase = await createClient();
    const { created } = await service.bulkGenerateInvoices(supabase, parsed);
    revalidatePath("/admin/fees/invoices");
    return created > 0
      ? { ok: true }
      : { ok: false, error: "No currently-enrolled students found for that class." };
  } catch (err) {
    return toResult(err, "Could not bulk-generate invoices.");
  }
}

export async function collectPaymentAction(input: CollectPaymentInput): Promise<ActionResult> {
  try {
    await requirePermission("fees.collect");
    const parsed = collectPaymentSchema.parse(input);
    const supabase = await createClient();
    await service.collectPayment(supabase, parsed);
    revalidatePath(`/admin/fees/invoices/${input.invoice_id}`);
    revalidatePath("/admin/fees/invoices");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record payment.");
  }
}

export async function voidPaymentAction(input: VoidPaymentInput): Promise<ActionResult> {
  try {
    await requirePermission("fees.refund");
    const parsed = voidPaymentSchema.parse(input);
    const supabase = await createClient();
    await service.voidPayment(supabase, parsed.payment_id, parsed.reason);
    revalidatePath("/admin/fees/invoices");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not void payment.");
  }
}

export type CreateOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string }
  | { ok: false; error: string };

/**
 * No requirePermission call here on purpose — authorization is the RLS
 * read itself. getInvoice runs on the caller's own session; a portal
 * user's fee_invoices SELECT policy only returns rows they own
 * (0024_portal_access.sql), so a null invoice here means "not yours or
 * doesn't exist," and either way nothing gets created.
 */
export async function createPaymentOrderAction(invoiceId: string): Promise<CreateOrderResult> {
  try {
    const supabase = await createClient();
    const invoice = await service.getInvoice(supabase, invoiceId);
    if (!invoice) return { ok: false, error: "Invoice not found." };

    const payments = await service.listPaymentsForInvoice(supabase, invoiceId);
    const { balance } = computeInvoiceBalance(invoice, payments);
    if (balance <= 0) return { ok: false, error: "This invoice is already fully paid." };

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return { ok: false, error: "Online payment is not configured yet." };

    const order = await createRazorpayOrder({
      amountInPaise: Math.round(balance * 100),
      receipt: invoice.invoice_no,
      invoiceId: invoice.id,
    });

    return { ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start payment." };
  }
}
