import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    student_id: z.string().uuid("Choose a child"),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required"),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date is required"),
    reason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.to_date >= data.from_date, {
    message: "End date must be on or after the start date",
    path: ["to_date"],
  });

export const reviewLeaveRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type ReviewLeaveRequestInput = z.infer<typeof reviewLeaveRequestSchema>;
