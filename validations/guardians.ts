import { z } from "zod";

export const createGuardianSchema = z.object({
  student_id: z.string().uuid(),
  full_name: z.string().trim().min(1, "Name is required").max(100),
  relationship: z.enum(["father", "mother", "guardian"]),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  email: z.string().trim().max(100).optional().or(z.literal("")),
  is_primary: z.boolean(),
});

export const linkPortalAccountSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type LinkPortalAccountInput = z.infer<typeof linkPortalAccountSchema>;
