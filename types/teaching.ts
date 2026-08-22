export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Timetable {
  id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_no: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type LessonPlanStatus = "pending" | "in_progress" | "completed";

export interface LessonPlan {
  id: string;
  academic_year_id: string;
  class_id: string;
  subject_id: string;
  topic_title: string;
  description: string | null;
  planned_date: string;
  status: LessonPlanStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Homework {
  id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  homework_date: string;
  submission_date: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
