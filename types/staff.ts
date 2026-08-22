export type StaffStatus = "active" | "inactive" | "resigned";

export interface Staff {
  id: string;
  user_id: string | null;
  staff_no: string;
  first_name: string;
  last_name: string;
  father_name: string | null;
  mother_name: string | null;
  email: string;
  phone: string;
  emergency_contact: string | null;
  gender: "male" | "female" | "other";
  dob: string;
  date_of_joining: string;
  qualification: string | null;
  work_experience: string | null;
  designation: string | null;
  department: string | null;
  basic_salary: number;
  blood_group: string | null;
  address: string | null;
  photo_url: string | null;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type LeaveType = "sick" | "casual" | "earned" | "maternity";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type StaffAttendanceStatus = "present" | "absent" | "late" | "half_day" | "leave";

export interface StaffAttendanceRecord {
  id: string;
  staff_id: string;
  attendance_date: string;
  in_time: string | null;
  out_time: string | null;
  status: StaffAttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
