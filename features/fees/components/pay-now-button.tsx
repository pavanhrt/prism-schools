"use client";

import { useState } from "react";
import { createPaymentOrderAction } from "@/features/fees/actions";
import { Button } from "@/components/ui/button";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}

interface RazorpayCheckout {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

/**
 * Client-side success (the `handler` callback) is deliberately NOT treated
 * as confirmation — it only means the checkout widget completed. The
 * actual fee_payments row is written by the webhook (app/api/payments/
 * razorpay/webhook), server-to-server, after signature verification. This
 * button just reloads the page shortly after, to pick up what the webhook
 * (which fires within seconds in practice) has by then recorded.
 */
export function PayNowButton({
  invoiceId,
  invoiceNo,
  studentName,
}: {
  invoiceId: string;
  invoiceNo: string;
  studentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    setStatus(null);
    const result = await createPaymentOrderAction(invoiceId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      if (!window.Razorpay) {
        setError("Could not load the payment widget.");
        return;
      }
      const checkout = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        order_id: result.orderId,
        name: "Fee Payment",
        description: `Invoice ${invoiceNo}`,
        prefill: { name: studentName },
        handler: () => {
          setStatus("Payment submitted — confirming, this page will update shortly.");
          setTimeout(() => window.location.reload(), 4000);
        },
        modal: { ondismiss: () => setStatus(null) },
      });
      checkout.open();
    };
    script.onerror = () => setError("Could not load the payment widget.");
    document.body.appendChild(script);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={pay} disabled={loading}>
        {loading ? "Starting…" : "Pay now"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {status && <p className="text-xs text-emerald-600">{status}</p>}
    </div>
  );
}
