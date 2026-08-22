import type { SupabaseClient } from "@supabase/supabase-js";
import type { Homework, LessonPlan, TeacherAssignment, Timetable } from "@/types/teaching";

// ---- Teacher assignments ----------------------------------------------------

export async function listTeacherAssignments(
  supabase: SupabaseClient,
): Promise<TeacherAssignment[]> {
  const { data, error } = await supabase
    .from("teacher_assignments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewTeacherAssignment = Pick<
  TeacherAssignment,
  "teacher_id" | "academic_year_id" | "class_id" | "section_id" | "subject_id"
>;

export async function insertTeacherAssignment(
  supabase: SupabaseClient,
  input: NewTeacherAssignment,
): Promise<TeacherAssignment> {
  const { data, error } = await supabase
    .from("teacher_assignments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeacherAssignment(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
  if (error) throw error;
}

/** Profiles for everyone holding the "teacher" role — used to populate the
 * teacher picker without ever needing to query auth.users from the client.
 * Two queries, not an embed: user_roles has no direct FK to profiles (both
 * point at auth.users independently), so PostgREST can't join them in one
 * request. */
export async function listTeacherProfiles(
  supabase: SupabaseClient,
): Promise<{ id: string; full_name: string }[]> {
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id, roles!inner(key)")
    .eq("roles.key", "teacher");
  if (roleError) throw roleError;

  const teacherIds = roleRows.map((r) => r.user_id);
  if (teacherIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", teacherIds);
  if (profileError) throw profileError;
  return profiles;
}

// ---- Timetable -----------------------------------------------------------

export async function listTimetable(
  supabase: SupabaseClient,
  classId?: string,
  sectionId?: string,
): Promise<Timetable[]> {
  let query = supabase.from("timetables").select("*").order("day_of_week").order("start_time");
  if (classId) query = query.eq("class_id", classId);
  if (sectionId) query = query.eq("section_id", sectionId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type NewTimetableEntry = Omit<
  Timetable,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertTimetableEntry(
  supabase: SupabaseClient,
  input: NewTimetableEntry,
): Promise<Timetable> {
  const { data, error } = await supabase.from("timetables").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTimetableEntry(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("timetables").delete().eq("id", id);
  if (error) throw error;
}

// ---- Lesson plans ----------------------------------------------------------

export async function listLessonPlans(supabase: SupabaseClient): Promise<LessonPlan[]> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("*")
    .order("planned_date", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewLessonPlan = Omit<
  LessonPlan,
  "id" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertLessonPlan(
  supabase: SupabaseClient,
  input: NewLessonPlan,
): Promise<LessonPlan> {
  const { data, error } = await supabase.from("lesson_plans").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateLessonPlanStatus(
  supabase: SupabaseClient,
  id: string,
  status: LessonPlan["status"],
): Promise<void> {
  const { error } = await supabase.from("lesson_plans").update({ status }).eq("id", id);
  if (error) throw error;
}

// ---- Homework --------------------------------------------------------------

export async function listHomework(supabase: SupabaseClient): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .order("homework_date", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewHomework = Omit<
  Homework,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertHomework(
  supabase: SupabaseClient,
  input: NewHomework,
): Promise<Homework> {
  const { data, error } = await supabase.from("homework").insert(input).select().single();
  if (error) throw error;
  return data;
}
