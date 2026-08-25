import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type {
  AcademicYearInput,
  ClassInput,
  SectionInput,
  SubjectInput,
} from "@/validations/academic";

/**
 * Business rules that don't belong in either the raw query layer or a
 * Server Action. Thin in Phase 1 by nature — academic setup is mostly
 * structural data — but real: the "only one current year" invariant and
 * class sequence auto-assignment both live here, not scattered across UI.
 */

export async function createAcademicYear(
  supabase: SupabaseClient,
  input: AcademicYearInput,
) {
  const year = await repo.insertAcademicYear(supabase, input);
  if (input.is_current) {
    await setCurrentAcademicYear(supabase, year.id);
  }
  return year;
}

/** Swaps which academic year is "current" — two statements, not one, so the
 * partial unique index on `is_current` never sees two true rows at once. */
export async function setCurrentAcademicYear(
  supabase: SupabaseClient,
  id: string,
) {
  await repo.clearCurrentAcademicYear(supabase);
  await repo.markAcademicYearCurrent(supabase, id);
}

export async function createClass(supabase: SupabaseClient, input: ClassInput) {
  return repo.insertClass(supabase, input);
}

/** Convenience for the "add class" form — defaults sequence to one past
 * whatever the highest existing class currently is. */
export async function nextClassSequence(supabase: SupabaseClient) {
  const max = await repo.maxClassSequence(supabase);
  return max + 1;
}

export async function createSection(
  supabase: SupabaseClient,
  input: SectionInput,
) {
  return repo.insertSection(supabase, {
    class_id: input.class_id,
    name: input.name,
    capacity: input.capacity ?? 40,
  });
}

export async function createSubject(
  supabase: SupabaseClient,
  input: SubjectInput,
) {
  return repo.insertSubject(supabase, {
    class_id: input.class_id,
    name: input.name,
    code: input.code || null,
    subject_type: input.subject_type,
  });
}

export const deleteAcademicYear = repo.deleteAcademicYear;
export const deleteClass = repo.deleteClass;
export const deleteSection = repo.deleteSection;
export const deleteSubject = repo.deleteSubject;
export const listSubjects = repo.listSubjects;
