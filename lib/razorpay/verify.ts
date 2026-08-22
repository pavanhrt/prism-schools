import { createHmac, timingSafeEqual } from "crypto";

// No "server-only" guard here on purpose: this is a pure function (the
// secret is passed in, never read from env), only ever imported by the
// webhook Route Handler — which can't reach the client bundle anyway —
// and by its own unit test.

/** Constant-time comparison — a naive === here would leak timing
 * information about how many leading bytes matched, which is exactly the
 * kind of thing that turns "verify a webhook signature" into a real
 * vulnerability instead of a formality. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
