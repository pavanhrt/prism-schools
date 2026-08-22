import type { SupabaseClient } from "@supabase/supabase-js";
import type { Hostel, HostelAllocation, HostelRoom } from "@/types/hostel";

export async function listHostels(supabase: SupabaseClient): Promise<Hostel[]> {
  const { data, error } = await supabase.from("hostels").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertHostel(
  supabase: SupabaseClient,
  input: Pick<Hostel, "name" | "type" | "address">,
): Promise<Hostel> {
  const { data, error } = await supabase.from("hostels").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listRooms(supabase: SupabaseClient): Promise<HostelRoom[]> {
  const { data, error } = await supabase.from("hostel_rooms").select("*").order("room_no");
  if (error) throw error;
  return data;
}

export async function insertRoom(
  supabase: SupabaseClient,
  input: Pick<HostelRoom, "hostel_id" | "room_no" | "room_type" | "capacity" | "cost_per_bed">,
): Promise<HostelRoom> {
  const { data, error } = await supabase.from("hostel_rooms").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listAllocations(supabase: SupabaseClient): Promise<HostelAllocation[]> {
  const { data, error } = await supabase
    .from("hostel_allocations")
    .select("*")
    .order("allocated_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertAllocation(
  supabase: SupabaseClient,
  roomId: string,
  studentId: string,
): Promise<HostelAllocation> {
  const { data, error } = await supabase
    .from("hostel_allocations")
    .insert({ room_id: roomId, student_id: studentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function vacateAllocation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("hostel_allocations")
    .update({ status: "vacated", vacated_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}
