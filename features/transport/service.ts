import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type {
  AllocateTransportInput,
  TransportRouteInput,
  TransportStopInput,
  VehicleInput,
} from "@/validations/transport";

export const listVehicles = repo.listVehicles;
export const listRoutes = repo.listRoutes;
export const listStops = repo.listStops;
export const listAllocations = repo.listAllocations;

export async function createVehicle(supabase: SupabaseClient, input: VehicleInput) {
  return repo.insertVehicle(supabase, {
    vehicle_no: input.vehicle_no,
    model: input.model || null,
    driver_name: input.driver_name || null,
    driver_phone: input.driver_phone || null,
    capacity: input.capacity ?? 0,
  });
}

export async function createRoute(supabase: SupabaseClient, input: TransportRouteInput) {
  return repo.insertRoute(supabase, {
    route_name: input.route_name,
    vehicle_id: input.vehicle_id || null,
    fare: input.fare ?? 0,
  });
}

export async function createStop(supabase: SupabaseClient, input: TransportStopInput) {
  return repo.insertStop(supabase, {
    route_id: input.route_id,
    stop_name: input.stop_name,
    sequence: input.sequence,
    pickup_time: input.pickup_time || null,
  });
}

export async function allocateStudent(supabase: SupabaseClient, input: AllocateTransportInput) {
  return repo.insertAllocation(supabase, {
    student_id: input.student_id,
    route_id: input.route_id,
    stop_id: input.stop_id || null,
    academic_year_id: input.academic_year_id,
  });
}
