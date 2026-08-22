import { z } from "zod";

export const vehicleSchema = z.object({
  vehicle_no: z.string().trim().min(1, "Vehicle number is required").max(50),
  model: z.string().trim().max(100).optional().or(z.literal("")),
  driver_name: z.string().trim().max(100).optional().or(z.literal("")),
  driver_phone: z.string().trim().max(20).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(0).optional(),
});

export const transportRouteSchema = z.object({
  route_name: z.string().trim().min(1, "Route name is required").max(150),
  vehicle_id: z.string().uuid().optional().or(z.literal("")),
  fare: z.coerce.number().min(0).optional(),
});

export const transportStopSchema = z.object({
  route_id: z.string().uuid(),
  stop_name: z.string().trim().min(1, "Stop name is required").max(150),
  sequence: z.coerce.number().int().min(0),
  pickup_time: z.string().optional().or(z.literal("")),
});

export const allocateTransportSchema = z.object({
  student_id: z.string().uuid("Choose a student"),
  route_id: z.string().uuid("Choose a route"),
  stop_id: z.string().uuid().optional().or(z.literal("")),
  academic_year_id: z.string().uuid("Choose an academic year"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type TransportRouteInput = z.infer<typeof transportRouteSchema>;
export type TransportStopInput = z.infer<typeof transportStopSchema>;
export type AllocateTransportInput = z.infer<typeof allocateTransportSchema>;
