import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student } from "@/types/students";

/**
 * Resolves which student record(s) the signed-in portal user can see —
 * either themselves (a student login) or their linked children (a
 * guardian login). Relies entirely on RLS: these are plain selects on the
 * user-scoped client, not a service-role bypass, so this function can
 * never return more than students_select's ownership policy already
 * allows (0024_portal_access.sql).
 */
export async function getPortalStudents(
  supabase: SupabaseClient,
  userId: string,
): Promise<Student[]> {
  const { data: ownStudent, error: ownError } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownError) throw ownError;
  if (ownStudent) return [ownStudent];

  const { data: guardianRow, error: guardianError } = await supabase
    .from("guardians")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (guardianError) throw guardianError;
  if (!guardianRow) return [];

  const { data: links, error: linksError } = await supabase
    .from("student_guardians")
    .select("student_id")
    .eq("guardian_id", guardianRow.id);
  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .in("id", links.map((l) => l.student_id));
  if (studentsError) throw studentsError;
  return students ?? [];
}

/** Pure — which of the caller's own students the switcher should show,
 * given what's in the URL. Falls back to the first student whenever the
 * requested id is missing or isn't actually one of theirs (e.g. a stale
 * link, or someone trying another family's student_id in the URL). */
export function pickActiveStudent(students: Student[], requestedId?: string): Student | null {
  if (requestedId) {
    const found = students.find((s) => s.id === requestedId);
    if (found) return found;
  }
  return students[0] ?? null;
}

export async function resolveActiveStudent(
  supabase: SupabaseClient,
  userId: string,
  requestedId?: string,
): Promise<{ students: Student[]; active: Student | null }> {
  const students = await getPortalStudents(supabase, userId);
  return { students, active: pickActiveStudent(students, requestedId) };
}
