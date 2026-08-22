import { z } from "zod";

export const academicYearSchema = z
  .object({
    year_label: z
      .string()
      .trim()
      .min(4, "Enter a year label, e.g. 2026-27")
      .max(20),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    is_current: z.boolean(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });

export const classSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(100),
  sequence: z.coerce.number().int().min(0).max(100),
});

export const sectionSchema = z.object({
  class_id: z.string().uuid("Choose a class"),
  name: z.string().trim().min(1, "Section name is required").max(50),
  capacity: z.coerce.number().int().min(1).max(200),
});

export const subjectSchema = z.object({
  class_id: z.string().uuid("Choose a class"),
  name: z.string().trim().min(1, "Subject name is required").max(100),
  code: z.string().trim().max(50).optional().or(z.literal("")),
  subject_type: z.enum(["theory", "practical", "both"]),
});

export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
