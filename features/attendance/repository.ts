import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentAttendanceRecord } from "@/types/attendance";

export async function listAttendanceForDate(
  supabase: SupabaseClient,
  classId: string,
  sectionId: string,
  date: string,
): Promise<StudentAttendanceRecord[]> {
  const { data, error } = await supabase
    .from("student_attendance")
    .select("*")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("attendance_date", date);
  if (error) throw error;
  return data;
}

export type AttendanceUpsert = Pick<
  StudentAttendanceRecord,
  "student_id" | "academic_year_id" | "class_id" | "section_id" | "attendance_date" | "status" | "note"
>;

export async function upsertAttendance(
  supabase: SupabaseClient,
  entries: AttendanceUpsert[],
): Promise<void> {
  const { error } = await supabase
    .from("student_attendance")
    .upsert(entries, { onConflict: "student_id,attendance_date" });
  if (error) throw error;
}

export async function listAttendanceForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentAttendanceRecord[]> {
  const { data, error } = await supabase
    .from("student_attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("attendance_date", { ascending: false });
  if (error) throw error;
  return data;
}
