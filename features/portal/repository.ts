import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaveRequestStatus, ParentNotification, StudentLeaveRequest } from "@/types/portal";

// ---- Notifications -----------------------------------------------------

export async function listNotifications(supabase: SupabaseClient, userId: string): Promise<ParentNotification[]> {
  const { data, error } = await supabase
    .from("parent_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("parent_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function upsertNotification(supabase: SupabaseClient, value: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("parent_notifications").upsert(value, { onConflict: "user_id,fingerprint" });
  if (error) throw error;
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("parent_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase
    .from("parent_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

// ---- Student leave requests ----------------------------------------------

export async function listLeaveRequestsForStudent(supabase: SupabaseClient, studentId: string): Promise<StudentLeaveRequest[]> {
  const { data, error } = await supabase
    .from("student_leave_requests")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listAllLeaveRequests(supabase: SupabaseClient, status?: LeaveRequestStatus): Promise<StudentLeaveRequest[]> {
  let query = supabase.from("student_leave_requests").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function insertLeaveRequest(
  supabase: SupabaseClient,
  value: { student_id: string; requested_by: string; from_date: string; to_date: string; reason: string | null },
): Promise<StudentLeaveRequest> {
  const { data, error } = await supabase.from("student_leave_requests").insert(value).select().single();
  if (error) throw error;
  return data;
}

export async function reviewLeaveRequest(
  supabase: SupabaseClient,
  id: string,
  value: { status: "approved" | "rejected"; reviewed_by: string; review_note: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("student_leave_requests")
    .update({ ...value, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---- Calendar (read-only aggregation source) ------------------------------

export interface CalendarOverrideRow {
  calendar_date: string;
  is_working_day: boolean;
  label: string;
}

export async function listCalendarOverrides(
  supabase: SupabaseClient,
  academicYearId: string,
  start: string,
  end: string,
): Promise<CalendarOverrideRow[]> {
  const { data, error } = await supabase
    .from("academic_calendar_days")
    .select("calendar_date, is_working_day, label")
    .eq("academic_year_id", academicYearId)
    .gte("calendar_date", start)
    .lte("calendar_date", end);
  if (error) throw error;
  return data ?? [];
}
