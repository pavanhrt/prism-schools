import { z } from "zod";

export const publicEnquirySchema = z.object({
  student_name: z.string().trim().min(1, "Student name is required").max(100),
  parent_name: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot: real visitors never see or fill this field (hidden via CSS);
  // a bot filling every input on the page will. Non-empty = silently drop.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type PublicEnquiryInput = z.infer<typeof publicEnquirySchema>;
