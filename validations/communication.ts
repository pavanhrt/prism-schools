import { z } from "zod";

export const noticeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(4000),
  target_role: z.enum(["all", "school_admin", "teacher", "accountant", "receptionist", "student", "parent"]),
  expiry_date: z.string().optional().or(z.literal("")),
});

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  body: z.string().trim().min(1, "Body is required").max(10000),
});

export const smsTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  body: z.string().trim().min(1, "Body is required").max(500),
});

export const sendEmailSchema = z.object({
  template_id: z.string().uuid("Choose a template"),
  recipient_email: z.string().trim().email("Enter a valid email"),
  recipient_group: z.string().trim().max(100).optional().or(z.literal("")),
  variables_json: z.string().optional().or(z.literal("")),
});

export type NoticeInput = z.infer<typeof noticeSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type SmsTemplateInput = z.infer<typeof smsTemplateSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
