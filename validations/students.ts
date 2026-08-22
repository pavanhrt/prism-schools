import { z } from "zod";

// Direct "walk-in admission" path — bypasses the CRM funnel entirely,
// matching the old system's student-admission.php. Creates a student and
// its first enrollment in one submission.
export const studentSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  blood_group: z.string().trim().max(10).optional().or(z.literal("")),
  religion: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  father_name: z.string().trim().max(100).optional().or(z.literal("")),
  mother_name: z.string().trim().max(100).optional().or(z.literal("")),
  guardian_phone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  previous_school: z.string().trim().max(200).optional().or(z.literal("")),
  academic_year_id: z.string().uuid("Choose an academic year"),
  class_id: z.string().uuid("Choose a class"),
  section_id: z.string().uuid("Choose a section"),
  roll_no: z.string().trim().max(20).optional().or(z.literal("")),
});

export type StudentInput = z.infer<typeof studentSchema>;
