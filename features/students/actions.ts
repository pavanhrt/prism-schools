"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import { decideParentLoginAction } from "./rules";
import { findOrCreateParentAuthUser, sendParentPasswordReset, setPortalAccessEnabled } from "./admin-auth";
import { studentSchema, type StudentInput } from "@/validations/students";
import {
  createGuardianSchema,
  linkPortalAccountSchema,
  type CreateGuardianInput,
  type LinkPortalAccountInput,
} from "@/validations/guardians";

/**
 * Deliberately NOT derived from request headers (x-forwarded-host is
 * client-influenceable on some hosting setups) — these URLs go into
 * Supabase-sent invitation/password-reset emails, so an untrusted origin
 * here would be a phishing vector against the parent receiving the email,
 * not just the admin driving the request. Env var first, then the
 * canonical deployed URL from AGENTS.md.
 */
function trustedOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://prismschoolsdev.netlify.app";
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): { ok: false; error: string } {
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

/**
 * The complete Admin → Student → Guardian → Create Parent Login flow.
 * Search-or-create is fully server-side (createAdminClient never leaves
 * this "use server" file); decideParentLoginAction (features/students/
 * rules.ts) is the single source of truth for which of Cases 1-5 applies,
 * so the branching itself is unit-tested without mocking Supabase or Auth.
 */
export async function createParentLoginAction(
  guardianId: string,
  studentId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    await requirePermission("students.edit");

    const supabase = await createClient();
    const guardians = await service.listGuardiansForStudent(supabase, studentId);
    const guardian = guardians.find((g) => g.id === guardianId);
    if (!guardian) throw new Error("This guardian is not linked to this student.");

    const existingAuthUserId = guardian.user_id
      ? null
      : guardian.email
        ? await service.findUserIdForLinking(supabase, guardian.email)
        : null;

    const decision = decideParentLoginAction({
      guardianUserId: guardian.user_id,
      guardianEmail: guardian.email,
      existingAuthUserId,
    });

    if (decision.action === "error") {
      const message = decision.reason === "missing_email"
        ? "This guardian has no email on file — add one before creating a login."
        : "This guardian's email on file is not valid — correct it before creating a login.";
      return { ok: false, error: message };
    }

    let userId: string;
    let message: string;
    if (decision.action === "already_linked") {
      userId = guardian.user_id!;
      message = "This guardian already has a portal login.";
    } else if (decision.action === "reuse_auth_user") {
      userId = decision.userId;
      await service.linkGuardianUser(supabase, guardianId, userId);
      message = "Linked to an existing account for this email.";
    } else {
      const origin = trustedOrigin();
      userId = await findOrCreateParentAuthUser({
        email: guardian.email!,
        fullName: guardian.full_name,
        existingUserId: null,
        redirectTo: `${origin}/auth/reset-password`,
      });
      await service.linkGuardianUser(supabase, guardianId, userId);
      message = "Login created — invitation email sent.";
    }

    // Idempotent — always ensure the role, even for an already-linked
    // guardian that predates this flow and may be missing it.
    await service.assignParentRole(supabase, userId);

    revalidatePath(`/admin/students/${studentId}`);
    return { ok: true, message };
  } catch (err) {
    return toResult(err, "Could not create parent login.");
  }
}

export async function sendParentPasswordResetAction(
  guardianId: string,
  studentId: string,
): Promise<ActionResult> {
  try {
    await requirePermission("students.edit");
    const supabase = await createClient();
    const guardians = await service.listGuardiansForStudent(supabase, studentId);
    const guardian = guardians.find((g) => g.id === guardianId);
    if (!guardian) throw new Error("This guardian is not linked to this student.");
    if (!guardian.user_id || !guardian.email) throw new Error("This guardian does not have a portal login yet.");

    const origin = trustedOrigin();
    await sendParentPasswordReset(guardian.email, `${origin}/auth/reset-password`);
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not send password reset.");
  }
}

export async function setGuardianPortalAccessAction(
  guardianId: string,
  studentId: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    await requirePermission("students.edit");
    const supabase = await createClient();
    const guardians = await service.listGuardiansForStudent(supabase, studentId);
    const guardian = guardians.find((g) => g.id === guardianId);
    if (!guardian) throw new Error("This guardian is not linked to this student.");
    if (!guardian.user_id) throw new Error("This guardian does not have a portal login yet.");

    await setPortalAccessEnabled(guardian.user_id, enabled);
    revalidatePath(`/admin/students/${studentId}`);
    return { ok: true };
  } catch (err) {
    return toResult(err, enabled ? "Could not enable portal access." : "Could not disable portal access.");
  }
}
