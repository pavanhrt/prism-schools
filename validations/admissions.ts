import { z } from "zod";

export const inquirySchema = z.object({
  student_name: z.string().trim().min(1, "Student name is required").max(100),
  parent_name: z.string().trim().min(1, "Parent/guardian name is required").max(100),
  email: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  class_requested_id: z.string().uuid().optional().or(z.literal("")),
  academic_year_id: z.string().uuid().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.enum(["web", "walk_in", "phone", "referral", "other"]),
});

export const followupSchema = z.object({
  inquiry_id: z.string().uuid(),
  notes: z.string().trim().min(1, "Notes are required").max(2000),
  followup_date: z.string().optional().or(z.literal("")),
});

export const applicationSchema = z.object({
  inquiry_id: z.string().uuid(),
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  blood_group: z.string().trim().max(10).optional().or(z.literal("")),
  father_name: z.string().trim().max(100).optional().or(z.literal("")),
  mother_name: z.string().trim().max(100).optional().or(z.literal("")),
  guardian_phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  previous_school: z.string().trim().max(200).optional().or(z.literal("")),
  class_applying_id: z.string().uuid("Choose a class"),
  academic_year_id: z.string().uuid("Choose an academic year"),
});

export const applicationDecisionSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected"]),
  decision_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const admitApplicationSchema = z.object({
  section_id: z.string().uuid("Choose a section"),
  roll_no: z.string().trim().max(20).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type FollowupInput = z.infer<typeof followupSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationDecisionInput = z.infer<typeof applicationDecisionSchema>;
export type AdmitApplicationInput = z.infer<typeof admitApplicationSchema>;
