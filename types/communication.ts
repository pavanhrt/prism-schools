export type NoticeStatus = "draft" | "active" | "expired";

export interface Notice {
  id: string;
  title: string;
  message: string;
  target_role: string;
  status: NoticeStatus;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tags_hint: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SmsTemplate {
  id: string;
  name: string;
  provider_template_id: string | null;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type LogStatus = "pending" | "sent" | "failed";

export interface EmailLog {
  id: string;
  sender_id: string | null;
  recipient_email: string;
  recipient_group: string | null;
  subject: string;
  body: string;
  status: LogStatus;
  error: string | null;
  created_at: string;
}

export interface SmsLog {
  id: string;
  sender_id: string | null;
  recipient_phone: string;
  recipient_group: string | null;
  message: string;
  provider: string | null;
  status: LogStatus;
  created_at: string;
}
