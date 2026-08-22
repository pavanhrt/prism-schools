import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentTransport, TransportRoute, TransportStop, Vehicle } from "@/types/transport";

export async function listVehicles(supabase: SupabaseClient): Promise<Vehicle[]> {
  const { data, error } = await supabase.from("vehicles").select("*").order("vehicle_no");
  if (error) throw error;
  return data;
}

export async function insertVehicle(
  supabase: SupabaseClient,
  input: Pick<Vehicle, "vehicle_no" | "model" | "driver_name" | "driver_phone" | "capacity">,
): Promise<Vehicle> {
  const { data, error } = await supabase.from("vehicles").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listRoutes(supabase: SupabaseClient): Promise<TransportRoute[]> {
  const { data, error } = await supabase.from("transport_routes").select("*").order("route_name");
  if (error) throw error;
  return data;
}

export async function insertRoute(
  supabase: SupabaseClient,
  input: Pick<TransportRoute, "route_name" | "vehicle_id" | "fare">,
): Promise<TransportRoute> {
  const { data, error } = await supabase.from("transport_routes").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listStops(supabase: SupabaseClient): Promise<TransportStop[]> {
  const { data, error } = await supabase.from("transport_stops").select("*").order("sequence");
  if (error) throw error;
  return data;
}

export async function insertStop(
  supabase: SupabaseClient,
  input: Pick<TransportStop, "route_id" | "stop_name" | "sequence" | "pickup_time">,
): Promise<TransportStop> {
  const { data, error } = await supabase.from("transport_stops").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listAllocations(supabase: SupabaseClient): Promise<StudentTransport[]> {
  const { data, error } = await supabase
    .from("student_transport")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertAllocation(
  supabase: SupabaseClient,
  input: Pick<StudentTransport, "student_id" | "route_id" | "stop_id" | "academic_year_id">,
): Promise<StudentTransport> {
  const { data, error } = await supabase.from("student_transport").insert(input).select().single();
  if (error) throw error;
  return data;
}
