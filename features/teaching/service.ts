import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type {
  HomeworkInput,
  LessonPlanInput,
  TeacherAssignmentInput,
  TimetableInput,
} from "@/validations/teaching";

export const listTeacherAssignments = repo.listTeacherAssignments;
export const listTeacherProfiles = repo.listTeacherProfiles;
export const deleteTeacherAssignment = repo.deleteTeacherAssignment;
export const listTimetable = repo.listTimetable;
export const deleteTimetableEntry = repo.deleteTimetableEntry;
export const listLessonPlans = repo.listLessonPlans;
export const listHomework = repo.listHomework;

export async function createTeacherAssignment(
  supabase: SupabaseClient,
  input: TeacherAssignmentInput,
) {
  return repo.insertTeacherAssignment(supabase, {
    teacher_id: input.teacher_id,
    academic_year_id: input.academic_year_id,
    class_id: input.class_id,
    section_id: input.section_id,
    subject_id: input.subject_id || null,
  });
}

export async function createTimetableEntry(
  supabase: SupabaseClient,
  input: TimetableInput,
) {
  return repo.insertTimetableEntry(supabase, {
    academic_year_id: input.academic_year_id,
    class_id: input.class_id,
    section_id: input.section_id,
    subject_id: input.subject_id,
    teacher_id: input.teacher_id || null,
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    room_no: input.room_no || null,
  });
}

export async function createLessonPlan(supabase: SupabaseClient, input: LessonPlanInput) {
  return repo.insertLessonPlan(supabase, {
    academic_year_id: input.academic_year_id,
    class_id: input.class_id,
    subject_id: input.subject_id,
    topic_title: input.topic_title,
    description: input.description || null,
    planned_date: input.planned_date,
  });
}

export const updateLessonPlanStatus = repo.updateLessonPlanStatus;

export async function createHomework(supabase: SupabaseClient, input: HomeworkInput) {
  return repo.insertHomework(supabase, {
    academic_year_id: input.academic_year_id,
    class_id: input.class_id,
    section_id: input.section_id,
    subject_id: input.subject_id,
    homework_date: input.homework_date,
    submission_date: input.submission_date,
    description: input.description,
  });
}
