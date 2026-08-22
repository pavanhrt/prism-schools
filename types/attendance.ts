export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export interface StudentAttendanceRecord {
  id: string;
  student_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
