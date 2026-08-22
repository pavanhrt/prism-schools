"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import { studentSchema, type StudentInput } from "@/validations/students";
import {
  createGuardianSchema,
  linkPortalAccountSchema,
  type CreateGuardianInput,
  type LinkPortalAccountInput,
} from "@/validations/guardians";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createStudentAction(input: StudentInput): Promise<ActionResult> {
  try {
    await requirePermission("students.create");
    const parsed = studentSchema.parse(input);
    const supabase = await createClient();
    await service.admitNewStudent(
      supabase,
      {
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        dob: parsed.dob,
        gender: parsed.gender,
        blood_group: parsed.blood_group || null,
        religion: parsed.religion || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        father_name: parsed.father_name || null,
        mother_name: parsed.mother_name || null,
        guardian_phone: parsed.guardian_phone || null,
        address: parsed.address || null,
        previous_school: parsed.previous_school || null,
        photo_url: null,
      },
      {
        academic_year_id: parsed.academic_year_id,
        class_id: parsed.class_id,
        section_id: parsed.section_id,
        roll_no: parsed.roll_no || null,
      },
    );
    revalidatePath("/admin/students");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create student.");
  }
}

export async function createGuardianAction(input: CreateGuardianInput): Promise<ActionResult> {
  try {
    await requirePermission("students.edit");
    const parsed = createGuardianSchema.parse(input);
    const supabase = await createClient();
    await service.createGuardianForStudent(
      supabase,
      parsed.student_id,
      {
        full_name: parsed.full_name,
        relationship: parsed.relationship,
        phone: parsed.phone,
        email: parsed.email || null,
      },
      parsed.is_primary,
    );
    revalidatePath(`/admin/students/${parsed.student_id}`);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add guardian.");
  }
}

export async function linkStudentPortalAction(
  studentId: string,
  input: LinkPortalAccountInput,
): Promise<ActionResult> {
  try {
    await requirePermission("students.edit");
    const parsed = linkPortalAccountSchema.parse(input);
    const supabase = await createClient();
    const userId = await service.findUserIdForLinking(supabase, parsed.email);
    if (!userId) return { ok: false, error: `No account found for ${parsed.email}.` };
    await service.linkStudentUser(supabase, studentId, userId);
    revalidatePath(`/admin/students/${studentId}`);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not link portal account.");
  }
}

export async function linkGuardianPortalAction(
  guardianId: string,
  studentId: string,
  input: LinkPortalAccountInput,
): Promise<ActionResult> {
  try {
    await requirePermission("students.edit");
    const parsed = linkPortalAccountSchema.parse(input);
    const supabase = await createClient();
    const userId = await service.findUserIdForLinking(supabase, parsed.email);
    if (!userId) return { ok: false, error: `No account found for ${parsed.email}.` };
    await service.linkGuardianUser(supabase, guardianId, userId);
    revalidatePath(`/admin/students/${studentId}`);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not link portal account.");
  }
}
