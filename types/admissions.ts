export type InquiryStatus = "pending" | "followed_up" | "converted" | "closed";
export type InquirySource = "web" | "walk_in" | "phone" | "referral" | "other";

export interface AdmissionInquiry {
  id: string;
  student_name: string;
  parent_name: string;
  email: string | null;
  phone: string;
  class_requested_id: string | null;
  academic_year_id: string | null;
  message: string | null;
  status: InquiryStatus;
  source: InquirySource;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface InquiryFollowup {
  id: string;
  inquiry_id: string;
  notes: string;
  followup_date: string | null;
  created_at: string;
  created_by: string | null;
}

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected";

export interface Application {
  id: string;
  inquiry_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: "male" | "female" | "other";
  blood_group: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_phone: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  previous_school: string | null;
  class_applying_id: string;
  academic_year_id: string;
  status: ApplicationStatus;
  decision_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
