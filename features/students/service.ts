import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { NewEnrollment, NewStudent } from "./repository";

/**
 * Creates a student and its first enrollment together. This is the one
 * path into the students table — used directly by the walk-in admission
 * form, and by features/admissions/service's admitApplication, so a
 * student can never exist without a current class/section.
 */
export async function admitNewStudent(
  supabase: SupabaseClient,
  student: NewStudent,
  enrollment: Omit<NewEnrollment, "student_id">,
) {
  const created = await repo.insertStudent(supabase, student);
  const firstEnrollment = await repo.insertEnrollment(supabase, {
    ...enrollment,
    student_id: created.id,
  });
  return { student: created, enrollment: firstEnrollment };
}

export const listStudents = repo.listStudents;
export const getStudent = repo.getStudent;
export const listEnrollmentsForStudent = repo.listEnrollmentsForStudent;
export const listCurrentEnrollments = repo.listCurrentEnrollments;
export const listRoster = repo.listRoster;
export const listRosterForClass = repo.listRosterForClass;
export const linkStudentUser = repo.linkStudentUser;
export const findUserIdForLinking = repo.findUserIdForLinking;
export const listGuardiansForStudent = repo.listGuardiansForStudent;
export const linkGuardianUser = repo.linkGuardianUser;

export async function createGuardianForStudent(
  supabase: SupabaseClient,
  studentId: string,
  input: { full_name: string; relationship: "father" | "mother" | "guardian"; phone: string; email: string | null },
  isPrimary: boolean,
) {
  const guardian = await repo.insertGuardian(supabase, input);
  await repo.linkGuardianToStudent(supabase, studentId, guardian.id, isPrimary);
  return guardian;
}
