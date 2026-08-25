import { z } from "zod";

export const examTermSchema = z.object({
  academic_year_id: z.string().uuid("Choose an academic year"),
  name: z.string().trim().min(1, "Term name is required").max(100),
});

// comparison_group and sequence_no must be supplied together or not at all
// — a group without a sequence (or vice versa) can never be deterministically
// ordered, so it's rejected rather than silently treated as "not comparable".
function refineComparisonPair<T extends { comparison_group?: string; sequence_no?: string }>(schema: z.ZodType<T>) {
  return schema
    .refine((data) => !data.sequence_no || Number(data.sequence_no) >= 1, {
      message: "Sequence must be 1 or greater",
      path: ["sequence_no"],
    })
    .refine((data) => Boolean(data.comparison_group) === Boolean(data.sequence_no), {
      message: "Comparison group and sequence must be supplied together, or both left blank",
      path: ["sequence_no"],
    });
}

const comparisonFields = {
  comparison_group: z.string().trim().max(100).optional().or(z.literal("")),
  sequence_no: z
    .string()
    .trim()
    .regex(/^\d*$/, "Sequence must be a whole number")
    .max(4)
    .optional()
    .or(z.literal("")),
};

export const examSchema = refineComparisonPair(
  z.object({
    term_id: z.string().uuid("Choose a term"),
    name: z.string().trim().min(1, "Exam name is required").max(100),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    ...comparisonFields,
  }),
);

export const examComparisonSchema = refineComparisonPair(
  z.object({
    id: z.string().uuid(),
    ...comparisonFields,
  }),
);

export const examScheduleSchema = z
  .object({
    exam_id: z.string().uuid("Choose an exam"),
    class_id: z.string().uuid("Choose a class"),
    subject_id: z.string().uuid("Choose a subject"),
    exam_date: z.string().min(1, "Exam date is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    room_no: z.string().trim().max(50).optional().or(z.literal("")),
    max_marks_theory: z.coerce.number().min(0).max(1000),
    max_marks_practical: z.coerce.number().min(0).max(1000),
    pass_marks: z.coerce.number().min(0).max(1000),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const enterMarksSchema = z.object({
  exam_schedule_id: z.string().uuid(),
  entries: z.array(
    z.object({
      student_id: z.string().uuid(),
      marks_theory: z.coerce.number().min(0).nullable(),
      marks_practical: z.coerce.number().min(0).nullable(),
      attendance_status: z.enum(["present", "absent", "medical", "late"]),
    }),
  ),
});

export const gradeScaleSchema = z
  .object({
    grade_name: z.string().trim().min(1, "Grade name is required").max(10),
    min_percentage: z.coerce.number().min(0).max(100),
    max_percentage: z.coerce.number().min(0).max(100),
    grade_point: z.coerce.number().min(0).max(10),
    description: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((data) => data.max_percentage > data.min_percentage, {
    message: "Max % must be greater than min %",
    path: ["max_percentage"],
  });

export type ExamTermInput = z.infer<typeof examTermSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type ExamComparisonInput = z.infer<typeof examComparisonSchema>;
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;
export type EnterMarksInput = z.infer<typeof enterMarksSchema>;
export type GradeScaleInput = z.infer<typeof gradeScaleSchema>;
