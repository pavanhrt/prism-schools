"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import { markAttendanceSchema, type MarkAttendanceInput } from "@/validations/attendance";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function markAttendanceAction(input: MarkAttendanceInput): Promise<ActionResult> {
  try {
    // requirePermission is the coarse "can this role mark attendance at
    // all" gate; RLS's is_class_teacher() check is what actually confines
    // a teacher to their own homeroom section — see 0012_student_attendance.sql.
    await requirePermission("attendance.mark");
    const parsed = markAttendanceSchema.parse(input);
    const supabase = await createClient();
    await service.markAttendance(supabase, parsed);
    revalidatePath("/admin/attendance");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not save attendance.");
  }
}
