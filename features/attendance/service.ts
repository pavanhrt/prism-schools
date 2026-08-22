import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { MarkAttendanceInput } from "@/validations/attendance";

export const listAttendanceForDate = repo.listAttendanceForDate;
export const listAttendanceForStudent = repo.listAttendanceForStudent;

/** One submit marks the whole section for the day — upsert means re-marking
 * an already-recorded day corrects it rather than erroring on the
 * (student_id, attendance_date) unique constraint. */
export async function markAttendance(supabase: SupabaseClient, input: MarkAttendanceInput) {
  await repo.upsertAttendance(
    supabase,
    input.entries.map((entry) => ({
      student_id: entry.student_id,
      academic_year_id: input.academic_year_id,
      class_id: input.class_id,
      section_id: input.section_id,
      attendance_date: input.attendance_date,
      status: entry.status,
      note: entry.note || null,
    })),
  );
}
