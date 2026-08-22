import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "@/lib/razorpay/verify";

describe("verifyWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  it("accepts a correctly signed payload", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret", () => {
    const signature = createHmac("sha256", "wrong-secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature, secret)).toBe(false);
  });

  it("rejects a tampered body even with a superficially valid signature", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const tamperedBody = body.replace("payment.captured", "payment.failed");
    expect(verifyWebhookSignature(tamperedBody, signature, secret)).toBe(false);
  });

  it("rejects a malformed/short signature instead of throwing", () => {
    expect(verifyWebhookSignature(body, "not-a-real-signature", secret)).toBe(false);
  });
});
