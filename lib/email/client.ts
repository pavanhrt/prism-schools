import "server-only";

/**
 * Thin wrapper over Resend's REST API — no SDK dependency for one POST
 * request. Mirrors lib/razorpay/client.ts: throws a clear error if unconfigured
 * rather than failing silently, so a missing RESEND_API_KEY shows up as
 * "email not sent" with a reason, not a swallowed no-op.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_ADDRESS;
  if (!apiKey || !from) {
    throw new Error("Email is not configured (RESEND_API_KEY / RESEND_FROM_ADDRESS missing).");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed: ${body}`);
  }

  return response.json();
}
