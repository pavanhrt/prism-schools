import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnquirySchema } from "@/validations/public";

/**
 * The public inquiry form — admission_inquiries has no insert policy for
 * anonymous visitors (0007_admissions.sql said this would land here), so
 * this writes via the service-role client, same pattern as every other
 * anonymous-write path in the app (login_attempts, the Razorpay webhook).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = publicEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  // Honeypot tripped — pretend success so the bot doesn't learn anything,
  // but don't actually write a row.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("admission_inquiries").insert({
    student_name: parsed.data.student_name,
    parent_name: parsed.data.parent_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    message: parsed.data.message || null,
    source: "web",
  });

  if (error) {
    console.error("Public enquiry insert failed:", error.message);
    return NextResponse.json({ error: "Could not submit your enquiry. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
