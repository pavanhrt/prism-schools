export interface ExamTerm {
  id: string;
  academic_year_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ExamStatus = "draft" | "scheduled" | "completed";

export interface Exam {
  id: string;
  term_id: string;
  name: string;
  description: string | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ResultStatus = "draft" | "submitted" | "approved" | "published" | "locked";

export interface ExamSchedule {
  id: string;
  exam_id: string;
  class_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string | null;
  max_marks_theory: number;
  max_marks_practical: number;
  pass_marks: number;
  result_status: ResultStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ExamAttendanceStatus = "present" | "absent" | "medical" | "late";

export interface ExamResult {
  id: string;
  exam_schedule_id: string;
  student_id: string;
  marks_theory: number | null;
  marks_practical: number | null;
  attendance_status: ExamAttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExamResultAudit {
  id: string;
  exam_result_id: string;
  changed_by: string | null;
  changed_at: string;
  before_marks_theory: number | null;
  before_marks_practical: number | null;
  after_marks_theory: number | null;
  after_marks_practical: number | null;
}

export interface GradeScale {
  id: string;
  grade_name: string;
  min_percentage: number;
  max_percentage: number;
  grade_point: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
