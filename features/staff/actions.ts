"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  leaveDecisionSchema,
  leaveRequestSchema,
  markStaffAttendanceSchema,
  staffSchema,
  type LeaveDecisionInput,
  type LeaveRequestInput,
  type MarkStaffAttendanceInput,
  type StaffInput,
} from "@/validations/staff";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createStaffAction(input: StaffInput): Promise<ActionResult> {
  try {
    await requirePermission("staff.create");
    const parsed = staffSchema.parse(input);
    const supabase = await createClient();
    await service.createStaff(supabase, parsed);
    revalidatePath("/admin/staff");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create staff record.");
  }
}

export async function createLeaveRequestAction(
  input: LeaveRequestInput,
): Promise<ActionResult> {
  try {
    await requirePermission("leave.create");
    const parsed = leaveRequestSchema.parse(input);
    const supabase = await createClient();
    await service.createLeaveRequest(supabase, parsed);
    revalidatePath("/admin/leave");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not log leave request.");
  }
}

export async function decideLeaveRequestAction(
  id: string,
  input: LeaveDecisionInput,
): Promise<ActionResult> {
  try {
    await requirePermission("leave.approve");
    const parsed = leaveDecisionSchema.parse(input);
    const supabase = await createClient();
    await service.decideLeaveRequest(supabase, id, parsed.status);
    revalidatePath("/admin/leave");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record decision.");
  }
}

export async function markStaffAttendanceAction(
  input: MarkStaffAttendanceInput,
): Promise<ActionResult> {
  try {
    await requirePermission("staff_attendance.mark");
    const parsed = markStaffAttendanceSchema.parse(input);
    const supabase = await createClient();
    await service.markStaffAttendance(supabase, parsed);
    revalidatePath("/admin/staff-attendance");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not save staff attendance.");
  }
}
