"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  admitApplicationSchema,
  applicationDecisionSchema,
  applicationSchema,
  followupSchema,
  inquirySchema,
  type AdmitApplicationInput,
  type ApplicationDecisionInput,
  type ApplicationInput,
  type FollowupInput,
  type InquiryInput,
} from "@/validations/admissions";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createInquiryAction(input: InquiryInput): Promise<ActionResult> {
  try {
    await requirePermission("admissions.create");
    const parsed = inquirySchema.parse(input);
    const supabase = await createClient();
    await service.createInquiry(supabase, {
      student_name: parsed.student_name,
      parent_name: parsed.parent_name,
      email: parsed.email || null,
      phone: parsed.phone,
      class_requested_id: parsed.class_requested_id || null,
      academic_year_id: parsed.academic_year_id || null,
      message: parsed.message || null,
      source: parsed.source,
    });
    revalidatePath("/admin/admissions/inquiries");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create inquiry.");
  }
}

export async function addFollowupAction(input: FollowupInput): Promise<ActionResult> {
  try {
    await requirePermission("admissions.edit");
    const parsed = followupSchema.parse(input);
    const supabase = await createClient();
    await service.addFollowup(supabase, parsed.inquiry_id, {
      notes: parsed.notes,
      followup_date: parsed.followup_date || null,
    });
    revalidatePath("/admin/admissions/inquiries");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add followup.");
  }
}

export async function createApplicationAction(
  input: ApplicationInput,
): Promise<ActionResult> {
  try {
    await requirePermission("admissions.create");
    const parsed = applicationSchema.parse(input);
    const supabase = await createClient();
    await service.createApplication(supabase, {
      inquiry_id: parsed.inquiry_id,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      dob: parsed.dob,
      gender: parsed.gender,
      blood_group: parsed.blood_group || null,
      father_name: parsed.father_name || null,
      mother_name: parsed.mother_name || null,
      guardian_phone: parsed.guardian_phone || null,
      email: parsed.email || null,
      phone: parsed.phone,
      address: parsed.address || null,
      previous_school: parsed.previous_school || null,
      class_applying_id: parsed.class_applying_id,
      academic_year_id: parsed.academic_year_id,
    });
    revalidatePath("/admin/admissions/applications");
    revalidatePath("/admin/admissions/inquiries");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create application.");
  }
}

export async function decideApplicationAction(
  applicationId: string,
  input: ApplicationDecisionInput,
): Promise<ActionResult> {
  try {
    await requirePermission("admissions.edit");
    const parsed = applicationDecisionSchema.parse(input);
    const supabase = await createClient();
    await service.decideApplication(supabase, applicationId, parsed);
    revalidatePath("/admin/admissions/applications");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record decision.");
  }
}

export async function admitApplicationAction(
  applicationId: string,
  input: AdmitApplicationInput,
): Promise<ActionResult> {
  try {
    // admissions.admit is deliberately separate from admissions.edit —
    // this action creates a permanent student record, a materially
    // higher-trust operation than managing the funnel up to this point.
    await requirePermission("admissions.admit");
    const parsed = admitApplicationSchema.parse(input);
    const supabase = await createClient();
    await service.admitApplication(supabase, applicationId, {
      section_id: parsed.section_id,
      roll_no: parsed.roll_no || null,
    });
    revalidatePath("/admin/admissions/applications");
    revalidatePath("/admin/students");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not admit application.");
  }
}
