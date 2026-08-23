import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaveRequest, Staff, StaffAttendanceRecord } from "@/types/staff";

// ---- Staff -----------------------------------------------------------------

export async function listStaff(supabase: SupabaseClient): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .order("first_name");
  if (error) throw error;
  return data;
}

export async function listActiveStaff(supabase: SupabaseClient): Promise<Staff[]> {
  const { data, error } = await supabase.from("staff").select("*").eq("status", "active");
  if (error) throw error;
  return data;
}

export async function getStaff(supabase: SupabaseClient, id: string): Promise<Staff | null> {
  const { data, error } = await supabase.from("staff").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateStaffPhoto(supabase: SupabaseClient, id: string, photoUrl: string | null): Promise<void> {
  const { error } = await supabase.from("staff").update({ photo_url: photoUrl }).eq("id", id);
  if (error) throw error;
}

export type NewStaff = Omit<
  Staff,
  "id" | "user_id" | "staff_no" | "status" | "photo_url" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertStaff(supabase: SupabaseClient, input: NewStaff): Promise<Staff> {
  const { data, error } = await supabase.from("staff").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Leave requests ------------------------------------------------------------

export async function listLeaveRequests(supabase: SupabaseClient): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewLeaveRequest = Pick<
  LeaveRequest,
  "staff_id" | "leave_type" | "start_date" | "end_date" | "reason"
>;

export async function insertLeaveRequest(
  supabase: SupabaseClient,
  input: NewLeaveRequest,
): Promise<LeaveRequest> {
  const { data, error } = await supabase.from("leave_requests").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function decideLeaveRequest(
  supabase: SupabaseClient,
  id: string,
  status: "approved" | "rejected",
): Promise<void> {
  const { error } = await supabase
    .from("leave_requests")
    .update({ status, reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---- Staff attendance -----------------------------------------------------------

export async function listStaffAttendanceForDate(
  supabase: SupabaseClient,
  date: string,
): Promise<StaffAttendanceRecord[]> {
  const { data, error } = await supabase
    .from("staff_attendance")
    .select("*")
    .eq("attendance_date", date);
  if (error) throw error;
  return data;
}

export type AttendanceUpsert = Pick<StaffAttendanceRecord, "staff_id" | "attendance_date" | "status">;

export async function upsertStaffAttendance(
  supabase: SupabaseClient,
  entries: AttendanceUpsert[],
): Promise<void> {
  const { error } = await supabase
    .from("staff_attendance")
    .upsert(entries, { onConflict: "staff_id,attendance_date" });
  if (error) throw error;
}
