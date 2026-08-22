import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
} from "@/types/academic";

/**
 * Pure data access — no permission checks, no business rules. Every
 * function takes a Supabase client instance so it works the same from a
 * Server Component read or a Server Action write; RLS is what actually
 * enforces access, this layer just shapes the queries.
 */

// ---- Academic Years ----------------------------------------------------

export async function listAcademicYears(
  supabase: SupabaseClient,
): Promise<AcademicYear[]> {
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertAcademicYear(
  supabase: SupabaseClient,
  input: Pick<AcademicYear, "year_label" | "start_date" | "end_date">,
): Promise<AcademicYear> {
  const { data, error } = await supabase
    .from("academic_years")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearCurrentAcademicYear(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase
    .from("academic_years")
    .update({ is_current: false })
    .eq("is_current", true);
  if (error) throw error;
}

export async function markAcademicYearCurrent(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("academic_years")
    .update({ is_current: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAcademicYear(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("academic_years").delete().eq("id", id);
  if (error) throw error;
}

// ---- Classes -------------------------------------------------------------

export async function listClasses(
  supabase: SupabaseClient,
): Promise<SchoolClass[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("sequence", { ascending: true });
  if (error) throw error;
  return data;
}

export async function maxClassSequence(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase
    .from("classes")
    .select("sequence")
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.sequence ?? -1;
}

export async function insertClass(
  supabase: SupabaseClient,
  input: Pick<SchoolClass, "name" | "sequence">,
): Promise<SchoolClass> {
  const { data, error } = await supabase
    .from("classes")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw error;
}

// ---- Sections --------------------------------------------------------------

export async function listSections(
  supabase: SupabaseClient,
  classId?: string,
): Promise<Section[]> {
  let query = supabase.from("sections").select("*").order("name");
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function insertSection(
  supabase: SupabaseClient,
  input: Pick<Section, "class_id" | "name" | "capacity">,
): Promise<Section> {
  const { data, error } = await supabase
    .from("sections")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSection(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) throw error;
}

// ---- Subjects --------------------------------------------------------------

export async function listSubjects(
  supabase: SupabaseClient,
  classId?: string,
): Promise<Subject[]> {
  let query = supabase.from("subjects").select("*").order("name");
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function insertSubject(
  supabase: SupabaseClient,
  input: Pick<Subject, "class_id" | "name" | "code" | "subject_type">,
): Promise<Subject> {
  const { data, error } = await supabase
    .from("subjects")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
}
