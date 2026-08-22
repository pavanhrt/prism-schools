import { z } from "zod";

export const staffSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  father_name: z.string().trim().max(100).optional().or(z.literal("")),
  mother_name: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  emergency_contact: z.string().trim().max(20).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().min(1, "Date of birth is required"),
  date_of_joining: z.string().min(1, "Joining date is required"),
  qualification: z.string().trim().max(500).optional().or(z.literal("")),
  designation: z.string().trim().max(100).optional().or(z.literal("")),
  department: z.string().trim().max(100).optional().or(z.literal("")),
  basic_salary: z.coerce.number().min(0, "Salary can't be negative"),
  blood_group: z.string().trim().max(10).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const leaveRequestSchema = z
  .object({
    staff_id: z.string().uuid("Choose a staff member"),
    leave_type: z.enum(["sick", "casual", "earned", "maternity"]),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  });

export const leaveDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const markStaffAttendanceSchema = z.object({
  attendance_date: z.string().min(1),
  entries: z
    .array(
      z.object({
        staff_id: z.string().uuid(),
        status: z.enum(["present", "absent", "late", "half_day", "leave"]),
      }),
    )
    .min(1, "No staff to mark"),
});

export type StaffInput = z.infer<typeof staffSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;
export type MarkStaffAttendanceInput = z.infer<typeof markStaffAttendanceSchema>;
