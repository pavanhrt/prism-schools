import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student, StudentEnrollment } from "@/types/students";
import type { Guardian } from "@/types/guardians";

export async function listStudents(supabase: SupabaseClient): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getStudent(
  supabase: SupabaseClient,
  id: string,
): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateStudentPhoto(supabase: SupabaseClient, id: string, photoUrl: string | null): Promise<void> {
  const { error } = await supabase.from("students").update({ photo_url: photoUrl }).eq("id", id);
  if (error) throw error;
}

export type NewStudent = Omit<
  Student,
  "id" | "user_id" | "admission_no" | "admission_date" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function linkStudentUser(
  supabase: SupabaseClient,
  studentId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from("students").update({ user_id: userId }).eq("id", studentId);
  if (error) throw error;
}

export async function findUserIdForLinking(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("find_auth_user_id_for_linking", {
    lookup_email: email,
  });
  if (error) throw error;
  return data ?? null;
}

// ---- Guardians -------------------------------------------------------------

export async function listGuardiansForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<(Guardian & { is_primary: boolean })[]> {
  const { data, error } = await supabase
    .from("student_guardians")
    .select("is_primary, guardians(*)")
    .eq("student_id", studentId);
  if (error) throw error;
  return data.map((row) => ({
    ...(row.guardians as unknown as Guardian),
    is_primary: row.is_primary,
  }));
}

export async function insertGuardian(
  supabase: SupabaseClient,
  input: Pick<Guardian, "full_name" | "relationship" | "phone" | "email">,
): Promise<Guardian> {
  const { data, error } = await supabase.from("guardians").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function linkGuardianToStudent(
  supabase: SupabaseClient,
  studentId: string,
  guardianId: string,
  isPrimary: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("student_guardians")
    .insert({ student_id: studentId, guardian_id: guardianId, is_primary: isPrimary });
  if (error) throw error;
}

/** RPC, not a table write — user_roles/roles are roles.manage-gated by
 * RLS, but this function is narrowly scoped to the fixed 'parent' role and
 * self-checks students.edit inside the function body (0039 migration). */
export async function assignParentRole(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase.rpc("assign_parent_role", { p_user_id: userId });
  if (error) throw error;
}

export async function linkGuardianUser(
  supabase: SupabaseClient,
  guardianId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from("guardians").update({ user_id: userId }).eq("id", guardianId);
  if (error) throw error;
}

export async function insertStudent(
  supabase: SupabaseClient,
  input: NewStudent,
): Promise<Student> {
  const { data, error } = await supabase.from("students").insert(input).select().single();
  if (error) throw error;
  return data;
}

/** Current roster for a class/section — the students an attendance sheet,
 * homework list, etc. actually needs, joined against student_enrollments'
 * is_current flag rather than trusting any denormalized "class" on
 * students itself (there is none — see 0008_students.sql). */
export async function listRoster(
  supabase: SupabaseClient,
  classId: string,
  sectionId: string,
): Promise<{ student_id: string; roll_no: string | null; first_name: string; last_name: string }[]> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select("student_id, roll_no, students(first_name, last_name)")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("is_current", true)
    .order("roll_no");
  if (error) throw error;
  return data.map((row) => {
    const student = row.students as unknown as { first_name: string; last_name: string } | null;
    return {
      student_id: row.student_id,
      roll_no: row.roll_no,
      first_name: student?.first_name ?? "",
      last_name: student?.last_name ?? "",
    };
  });
}

/** Same idea as listRoster, but class-wide — exam_schedules is class-level
 * (the same paper is sat by every section together), so marks entry needs
 * every currently-enrolled student in the class, not one section. */
export async function listRosterForClass(
  supabase: SupabaseClient,
  classId: string,
): Promise<{ student_id: string; roll_no: string | null; first_name: string; last_name: string; section_id: string }[]> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select("student_id, roll_no, section_id, students(first_name, last_name)")
    .eq("class_id", classId)
    .eq("is_current", true)
    .order("roll_no");
  if (error) throw error;
  return data.map((row) => {
    const student = row.students as unknown as { first_name: string; last_name: string } | null;
    return {
      student_id: row.student_id,
      roll_no: row.roll_no,
      section_id: row.section_id,
      first_name: student?.first_name ?? "",
      last_name: student?.last_name ?? "",
    };
  });
}

export async function listCurrentEnrollments(
  supabase: SupabaseClient,
): Promise<StudentEnrollment[]> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("is_current", true);
  if (error) throw error;
  return data;
}

export async function listEnrollmentsForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentEnrollment[]> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewEnrollment = Pick<
  StudentEnrollment,
  "student_id" | "academic_year_id" | "class_id" | "section_id" | "roll_no"
>;

export async function insertEnrollment(
  supabase: SupabaseClient,
  input: NewEnrollment,
): Promise<StudentEnrollment> {
  const { data, error } = await supabase
    .from("student_enrollments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}
