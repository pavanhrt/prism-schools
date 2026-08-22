import { z } from "zod";

export const markAttendanceSchema = z.object({
  academic_year_id: z.string().uuid(),
  class_id: z.string().uuid(),
  section_id: z.string().uuid(),
  attendance_date: z.string().min(1, "Date is required"),
  entries: z
    .array(
      z.object({
        student_id: z.string().uuid(),
        status: z.enum(["present", "absent", "late", "half_day"]),
        note: z.string().trim().max(500).optional().or(z.literal("")),
      }),
    )
    .min(1, "No students to mark"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
