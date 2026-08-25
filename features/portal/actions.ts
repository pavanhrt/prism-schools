"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  leaveRequestSchema,
  reviewLeaveRequestSchema,
  type LeaveRequestInput,
  type ReviewLeaveRequestInput,
} from "@/validations/portal";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

// ---- Student leave requests (parent-facing) ----------------------------

export async function submitLeaveRequestAction(input: LeaveRequestInput): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not signed in.");
    const parsed = leaveRequestSchema.parse(input);

    const supabase = await createClient();
    const { students } = await service.resolveActiveStudent(supabase, user.id, parsed.student_id);
    if (!students.some((s) => s.id === parsed.student_id)) {
      throw new Error("You can only submit a leave request for your own child.");
    }

    await service.submitLeaveRequest(supabase, {
      student_id: parsed.student_id,
      requested_by: user.id,
      from_date: parsed.from_date,
      to_date: parsed.to_date,
      reason: parsed.reason ? parsed.reason : null,
    });
    revalidatePath("/portal/leave-requests");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not submit leave request.");
  }
}

// ---- Notifications (parent-facing) --------------------------------------

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not signed in.");
    const supabase = await createClient();
    await service.markPortalNotificationRead(supabase, id);
    revalidatePath("/portal/notifications");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not mark notification as read.");
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not signed in.");
    const supabase = await createClient();
    await service.markAllPortalNotificationsRead(supabase, user.id);
    revalidatePath("/portal/notifications");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not mark notifications as read.");
  }
}

// ---- Staff review of student leave requests ------------------------------

export async function reviewLeaveRequestAction(input: ReviewLeaveRequestInput): Promise<ActionResult> {
  try {
    await requirePermission("attendance.edit");
    const parsed = reviewLeaveRequestSchema.parse(input);
    const user = await getCurrentUser();
    if (!user) throw new Error("Not signed in.");

    const supabase = await createClient();
    await service.reviewLeaveRequest(supabase, parsed.id, user.id, parsed.status, parsed.review_note ? parsed.review_note : null);
    revalidatePath("/admin/student-leave-requests");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not review leave request.");
  }
}
