export type NotificationCategory = "ATTENDANCE" | "EXAM" | "RESULT" | "FEE" | "ANNOUNCEMENT" | "LEAVE_REQUEST";

export interface ParentNotification {
  id: string;
  user_id: string;
  student_id: string | null;
  fingerprint: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export type LeaveRequestStatus = "submitted" | "approved" | "rejected";

export interface StudentLeaveRequest {
  id: string;
  student_id: string;
  requested_by: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  user_id: string | null;
  full_name: string;
  relationship: "father" | "mother" | "guardian";
  phone: string;
  email: string | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
