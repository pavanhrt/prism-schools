export type StudentStatus = "active" | "inactive" | "passed_out" | "struck_off";

export interface Student {
  id: string;
  user_id: string | null;
  admission_no: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: "male" | "female" | "other";
  blood_group: string | null;
  religion: string | null;
  email: string | null;
  phone: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  previous_school: string | null;
  photo_url: string | null;
  admission_date: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type EnrollmentStatus =
  | "enrolled"
  | "promoted"
  | "repeated"
  | "transferred_out"
  | "graduated";

export interface StudentEnrollment {
  id: string;
  student_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  roll_no: string | null;
  status: EnrollmentStatus;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
