import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Exam,
  ExamResult,
  ExamResultAudit,
  ExamSchedule,
  ExamTerm,
  GradeScale,
  ResultStatus,
} from "@/types/exams";

// ---- Terms -----------------------------------------------------------------

export async function listExamTerms(supabase: SupabaseClient): Promise<ExamTerm[]> {
  const { data, error } = await supabase
    .from("exam_terms")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertExamTerm(
  supabase: SupabaseClient,
  input: Pick<ExamTerm, "academic_year_id" | "name">,
): Promise<ExamTerm> {
  const { data, error } = await supabase.from("exam_terms").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Exams -------------------------------------------------------------------

export async function listExams(supabase: SupabaseClient): Promise<Exam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertExam(
  supabase: SupabaseClient,
  input: Pick<Exam, "term_id" | "name" | "description" | "comparison_group" | "sequence_no">,
): Promise<Exam> {
  const { data, error } = await supabase.from("exams").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Exam schedules ------------------------------------------------------------

export async function listExamSchedules(supabase: SupabaseClient): Promise<ExamSchedule[]> {
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("*")
    .order("exam_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getExamSchedule(
  supabase: SupabaseClient,
  id: string,
): Promise<ExamSchedule | null> {
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type NewExamSchedule = Omit<
  ExamSchedule,
  "id" | "result_status" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertExamSchedule(
  supabase: SupabaseClient,
  input: NewExamSchedule,
): Promise<ExamSchedule> {
  const { data, error } = await supabase.from("exam_schedules").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function submitResultsForReview(
  supabase: SupabaseClient,
  examScheduleId: string,
): Promise<void> {
  const { error } = await supabase.rpc("submit_results_for_review", {
    p_exam_schedule_id: examScheduleId,
  });
  if (error) throw error;
}

export async function advanceExamResultStatus(
  supabase: SupabaseClient,
  examScheduleId: string,
  newStatus: ResultStatus,
): Promise<void> {
  const { error } = await supabase.rpc("advance_exam_result_status", {
    p_exam_schedule_id: examScheduleId,
    p_new_status: newStatus,
  });
  if (error) throw error;
}

// ---- Exam results --------------------------------------------------------------

export async function listResultsForSchedule(
  supabase: SupabaseClient,
  examScheduleId: string,
): Promise<ExamResult[]> {
  const { data, error } = await supabase
    .from("exam_results")
    .select("*")
    .eq("exam_schedule_id", examScheduleId);
  if (error) throw error;
  return data;
}

export async function listResultsForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<ExamResult[]> {
  const { data, error } = await supabase
    .from("exam_results")
    .select("*")
    .eq("student_id", studentId);
  if (error) throw error;
  return data;
}

/** Batched read across many schedules at once — used by Management
 * Intelligence to assemble performance analytics for a whole academic year
 * without querying exam_results per student. */
export async function listResultsForSchedules(
  supabase: SupabaseClient,
  examScheduleIds: string[],
): Promise<ExamResult[]> {
  if (examScheduleIds.length === 0) return [];
  const { data, error } = await supabase
    .from("exam_results")
    .select("*")
    .in("exam_schedule_id", examScheduleIds);
  if (error) throw error;
  return data;
}

export type ResultUpsert = Pick<
  ExamResult,
  "exam_schedule_id" | "student_id" | "marks_theory" | "marks_practical" | "attendance_status"
>;

export async function upsertResults(
  supabase: SupabaseClient,
  entries: ResultUpsert[],
): Promise<void> {
  const { error } = await supabase
    .from("exam_results")
    .upsert(entries, { onConflict: "exam_schedule_id,student_id" });
  if (error) throw error;
}

export async function listAuditForResult(
  supabase: SupabaseClient,
  examResultId: string,
): Promise<ExamResultAudit[]> {
  const { data, error } = await supabase
    .from("exam_result_audit")
    .select("*")
    .eq("exam_result_id", examResultId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ---- Grade scales -----------------------------------------------------------

export async function listGradeScales(supabase: SupabaseClient): Promise<GradeScale[]> {
  const { data, error } = await supabase
    .from("grade_scales")
    .select("*")
    .order("min_percentage", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertGradeScale(
  supabase: SupabaseClient,
  input: Pick<GradeScale, "grade_name" | "min_percentage" | "max_percentage" | "grade_point" | "description">,
): Promise<GradeScale> {
  const { data, error } = await supabase.from("grade_scales").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGradeScale(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("grade_scales").delete().eq("id", id);
  if (error) throw error;
}
