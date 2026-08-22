import { z } from "zod";

export const teacherAssignmentSchema = z.object({
  teacher_id: z.string().uuid("Choose a teacher"),
  academic_year_id: z.string().uuid("Choose an academic year"),
  class_id: z.string().uuid("Choose a class"),
  section_id: z.string().uuid("Choose a section"),
  // Empty string means "class/homeroom teacher" (no subject) — coerced to
  // null before hitting the database.
  subject_id: z.string().uuid().optional().or(z.literal("")),
});

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const timetableSchema = z
  .object({
    academic_year_id: z.string().uuid("Choose an academic year"),
    class_id: z.string().uuid("Choose a class"),
    section_id: z.string().uuid("Choose a section"),
    subject_id: z.string().uuid("Choose a subject"),
    teacher_id: z.string().uuid().optional().or(z.literal("")),
    day_of_week: z.enum(DAYS),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    room_no: z.string().trim().max(50).optional().or(z.literal("")),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const lessonPlanSchema = z.object({
  academic_year_id: z.string().uuid("Choose an academic year"),
  class_id: z.string().uuid("Choose a class"),
  subject_id: z.string().uuid("Choose a subject"),
  topic_title: z.string().trim().min(1, "Topic is required").max(255),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  planned_date: z.string().min(1, "Planned date is required"),
  status: z.enum(["pending", "in_progress", "completed"]),
});

export const homeworkSchema = z
  .object({
    academic_year_id: z.string().uuid("Choose an academic year"),
    class_id: z.string().uuid("Choose a class"),
    section_id: z.string().uuid("Choose a section"),
    subject_id: z.string().uuid("Choose a subject"),
    homework_date: z.string().min(1, "Assigned date is required"),
    submission_date: z.string().min(1, "Due date is required"),
    description: z.string().trim().min(1, "Description is required").max(2000),
  })
  .refine((data) => data.submission_date >= data.homework_date, {
    message: "Due date must be on or after the assigned date",
    path: ["submission_date"],
  });

export type TeacherAssignmentInput = z.infer<typeof teacherAssignmentSchema>;
export type TimetableInput = z.infer<typeof timetableSchema>;
export type LessonPlanInput = z.infer<typeof lessonPlanSchema>;
export type HomeworkInput = z.infer<typeof homeworkSchema>;
