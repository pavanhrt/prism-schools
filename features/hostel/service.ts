import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { HostelInput, HostelRoomInput } from "@/validations/hostel";

export const listHostels = repo.listHostels;
export const listRooms = repo.listRooms;
export const listAllocations = repo.listAllocations;
export const vacateAllocation = repo.vacateAllocation;

export async function createHostel(supabase: SupabaseClient, input: HostelInput) {
  return repo.insertHostel(supabase, { name: input.name, type: input.type, address: input.address || null });
}

export async function createRoom(supabase: SupabaseClient, input: HostelRoomInput) {
  return repo.insertRoom(supabase, {
    hostel_id: input.hostel_id,
    room_no: input.room_no,
    room_type: input.room_type || null,
    capacity: input.capacity,
    cost_per_bed: input.cost_per_bed ?? 0,
  });
}

export async function allocateStudent(supabase: SupabaseClient, roomId: string, studentId: string) {
  return repo.insertAllocation(supabase, roomId, studentId);
}

/** Room occupancy is a count over active allocations, not a stored
 * counter on hostel_rooms — same "derive, don't trust a cached number"
 * rule as fee balances and inventory stock levels. */
export function computeRoomOccupancy(roomId: string, allocations: { room_id: string; status: string }[]): number {
  return allocations.filter((a) => a.room_id === roomId && a.status === "active").length;
}
