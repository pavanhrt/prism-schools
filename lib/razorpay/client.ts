import "server-only";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function authHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing).");
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

/**
 * Creates a Razorpay order for an invoice's outstanding balance. Not
 * called from anywhere yet — the customer-facing "Pay Now" trigger
 * belongs in the student/parent portal (Phase 8), which doesn't exist
 * yet. This exists now so that when it lands, the hard part (the webhook,
 * in app/api/payments/razorpay/webhook) is already built and tested.
 *
 * `notes.invoice_id` is what the webhook reads back off the captured
 * payment to know which invoice to credit — Razorpay echoes order/payment
 * notes back on every webhook event.
 */
export async function createRazorpayOrder(input: {
  amountInPaise: number;
  receipt: string;
  invoiceId: string;
}): Promise<RazorpayOrder> {
  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: { invoice_id: input.invoiceId },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed: ${body}`);
  }

  return response.json();
}
