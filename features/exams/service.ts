import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type {
  EnterMarksInput,
  ExamInput,
  ExamScheduleInput,
  ExamTermInput,
  GradeScaleInput,
} from "@/validations/exams";
import type { ResultStatus } from "@/types/exams";

export const listExamTerms = repo.listExamTerms;
export const listExams = repo.listExams;
export const listExamSchedules = repo.listExamSchedules;
export const getExamSchedule = repo.getExamSchedule;
export const listResultsForSchedule = repo.listResultsForSchedule;
export const listResultsForStudent = repo.listResultsForStudent;
export const listResultsForSchedules = repo.listResultsForSchedules;
export const listAuditForResult = repo.listAuditForResult;
export const listGradeScales = repo.listGradeScales;
export const deleteGradeScale = repo.deleteGradeScale;

export async function createExamTerm(supabase: SupabaseClient, input: ExamTermInput) {
  return repo.insertExamTerm(supabase, input);
}

export async function createExam(supabase: SupabaseClient, input: ExamInput) {
  return repo.insertExam(supabase, {
    term_id: input.term_id,
    name: input.name,
    description: input.description || null,
    comparison_group: input.comparison_group || null,
    sequence_no: input.sequence_no ? Number(input.sequence_no) : null,
  });
}

export async function createExamSchedule(supabase: SupabaseClient, input: ExamScheduleInput) {
  return repo.insertExamSchedule(supabase, {
    exam_id: input.exam_id,
    class_id: input.class_id,
    subject_id: input.subject_id,
    exam_date: input.exam_date,
    start_time: input.start_time,
    end_time: input.end_time,
    room_no: input.room_no || null,
    max_marks_theory: input.max_marks_theory,
    max_marks_practical: input.max_marks_practical,
    pass_marks: input.pass_marks,
  });
}

/** The only path for entering/editing marks — always an upsert, since a
 * teacher revisiting the sheet mid-draft should correct rows, not error on
 * exam_results' (exam_schedule_id, student_id) unique constraint. */
export async function enterMarks(supabase: SupabaseClient, input: EnterMarksInput) {
  await repo.upsertResults(
    supabase,
    input.entries.map((entry) => ({
      exam_schedule_id: input.exam_schedule_id,
      student_id: entry.student_id,
      marks_theory: entry.marks_theory,
      marks_practical: entry.marks_practical,
      attendance_status: entry.attendance_status,
    })),
  );
}

export async function submitForReview(supabase: SupabaseClient, examScheduleId: string) {
  await repo.submitResultsForReview(supabase, examScheduleId);
}

export async function advanceResultStatus(
  supabase: SupabaseClient,
  examScheduleId: string,
  newStatus: ResultStatus,
) {
  await repo.advanceExamResultStatus(supabase, examScheduleId, newStatus);
}

export async function createGradeScale(supabase: SupabaseClient, input: GradeScaleInput) {
  return repo.insertGradeScale(supabase, {
    grade_name: input.grade_name,
    min_percentage: input.min_percentage,
    max_percentage: input.max_percentage,
    grade_point: input.grade_point,
    description: input.description || null,
  });
}
