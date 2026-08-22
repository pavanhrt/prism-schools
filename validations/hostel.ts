import { z } from "zod";

export const hostelSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  type: z.enum(["boys", "girls", "staff", "common"]),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const hostelRoomSchema = z.object({
  hostel_id: z.string().uuid("Choose a hostel"),
  room_no: z.string().trim().min(1, "Room number is required").max(50),
  room_type: z.string().trim().max(100).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1, "At least 1 bed"),
  cost_per_bed: z.coerce.number().min(0).optional(),
});

export const allocateHostelSchema = z.object({
  room_id: z.string().uuid("Choose a room"),
  student_id: z.string().uuid("Choose a student"),
});

export type HostelInput = z.infer<typeof hostelSchema>;
export type HostelRoomInput = z.infer<typeof hostelRoomSchema>;
export type AllocateHostelInput = z.infer<typeof allocateHostelSchema>;
