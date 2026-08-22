import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay/verify";

/**
 * Razorpay webhook — the piece the legacy PHP app never had at all. Two
 * rules make this safe:
 *
 * 1. Signature verification happens before anything else touches the
 *    payload. No secret, no valid signature, no write.
 * 2. The write is idempotent: fee_payments.razorpay_payment_id carries a
 *    UNIQUE constraint, and this upsert uses ignoreDuplicates, so a
 *    retried delivery (Razorpay retries on anything but a 2xx) is a
 *    no-op, never a double-credit.
 *
 * Uses the service-role client deliberately — there is no signed-in user
 * on an incoming webhook request, so RLS has nothing to authenticate
 * against. Same pattern as login_attempts writes.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: RazorpayPaymentEntity } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Only a captured payment should ever create a fee_payments row — every
  // other event type (order.paid, payment.failed, refund.*, ...) is
  // acknowledged so Razorpay stops retrying it, but ignored.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  const invoiceId = payment?.notes?.invoice_id;
  if (!payment || !invoiceId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("fee_payments").upsert(
    {
      invoice_id: invoiceId,
      amount: payment.amount / 100,
      payment_date: new Date(payment.created_at * 1000).toISOString().slice(0, 10),
      payment_mode: "razorpay",
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: payment.id,
      razorpay_signature: signature,
      note: "Captured via Razorpay webhook",
    },
    { onConflict: "razorpay_payment_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Failed to record Razorpay payment:", error.message);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  created_at: number;
  notes?: { invoice_id?: string };
}
