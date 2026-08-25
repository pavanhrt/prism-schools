import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarOverride,
  IntelligenceSetting,
  ManagementAlert,
  StaffAttendanceInput,
  StudentAttendanceInput,
} from "./types";

export interface RosterRow {
  student_id: string;
  class_id: string;
  section_id: string;
  students: { admission_no: string; first_name: string; last_name: string; status: string };
  classes: { name: string };
  sections: { name: string };
}

export async function getCurrentAcademicYear(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, year_label, start_date, end_date")
    .eq("is_current", true)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; year_label: string; start_date: string; end_date: string } | null;
}

export async function getAcademicYear(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, year_label, start_date, end_date")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; year_label: string; start_date: string; end_date: string } | null;
}

export async function listAcademicYears(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, year_label, start_date, end_date, is_current")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listClassesAndSections(supabase: SupabaseClient) {
  const [{ data: classes, error: classError }, { data: sections, error: sectionError }] = await Promise.all([
    supabase.from("classes").select("id, name, sequence").order("sequence"),
    supabase.from("sections").select("id, name, class_id").order("name"),
  ]);
  if (classError) throw classError;
  if (sectionError) throw sectionError;
  return { classes: classes ?? [], sections: sections ?? [] };
}

export async function listCurrentRoster(
  supabase: SupabaseClient,
  academicYearId: string,
  classId?: string,
  sectionId?: string,
  studentId?: string,
): Promise<RosterRow[]> {
  let query = supabase
    .from("student_enrollments")
    .select("student_id, class_id, section_id, students!inner(admission_no, first_name, last_name, status), classes!inner(name), sections!inner(name)")
    .eq("academic_year_id", academicYearId)
    .eq("students.status", "active");
  if (classId) query = query.eq("class_id", classId);
  if (sectionId) query = query.eq("section_id", sectionId);
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RosterRow[];
}

export async function listStudentAttendance(
  supabase: SupabaseClient,
  academicYearId: string,
  start: string,
  end: string,
  classId?: string,
  sectionId?: string,
  studentId?: string,
): Promise<StudentAttendanceInput[]> {
  let query = supabase
    .from("student_attendance")
    .select("student_id, attendance_date, status")
    .eq("academic_year_id", academicYearId)
    .gte("attendance_date", start)
    .lte("attendance_date", end)
    .order("attendance_date");
  if (classId) query = query.eq("class_id", classId);
  if (sectionId) query = query.eq("section_id", sectionId);
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as StudentAttendanceInput[];
}

export async function listActiveStaff(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, staff_no, first_name, last_name")
    .eq("status", "active")
    .order("first_name");
  if (error) throw error;
  return data ?? [];
}

export async function listStaffAttendance(
  supabase: SupabaseClient,
  start: string,
  end: string,
): Promise<StaffAttendanceInput[]> {
  const { data, error } = await supabase
    .from("staff_attendance")
    .select("staff_id, attendance_date, status")
    .gte("attendance_date", start)
    .lte("attendance_date", end)
    .order("attendance_date");
  if (error) throw error;
  return (data ?? []) as StaffAttendanceInput[];
}

export async function listApprovedLeave(supabase: SupabaseClient, start: string, end: string) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("staff_id, start_date, end_date")
    .eq("status", "approved")
    .lte("start_date", end)
    .gte("end_date", start);
  if (error) throw error;
  return data ?? [];
}

export async function listSettings(supabase: SupabaseClient): Promise<IntelligenceSetting[]> {
  const { data, error } = await supabase
    .from("management_intelligence_settings")
    .select("*")
    .order("setting_key");
  if (error) throw error;
  return (data ?? []) as IntelligenceSetting[];
}

export async function updateNumericSetting(
  supabase: SupabaseClient,
  settingKey: string,
  numericValue: number,
): Promise<void> {
  const { error } = await supabase
    .from("management_intelligence_settings")
    .update({ numeric_value: numericValue, updated_by: (await supabase.auth.getUser()).data.user?.id ?? null })
    .eq("setting_key", settingKey)
    .eq("value_type", "numeric");
  if (error) throw error;
}

export async function upsertCalendarOverride(
  supabase: SupabaseClient,
  value: { academic_year_id: string; calendar_date: string; is_working_day: boolean; label: string },
) {
  const { error } = await supabase
    .from("academic_calendar_days")
    .upsert(value, { onConflict: "academic_year_id,calendar_date" });
  if (error) throw error;
}

export async function listWeeklyOffDays(supabase: SupabaseClient): Promise<number[]> {
  const { data, error } = await supabase.from("school_weekly_off_days").select("day_of_week").order("day_of_week");
  if (error) throw error;
  return (data ?? []).map((row) => Number(row.day_of_week));
}

export async function setWeeklyOffDay(supabase: SupabaseClient, dayOfWeek: number, enabled: boolean): Promise<void> {
  const query = enabled
    ? supabase.from("school_weekly_off_days").upsert({ day_of_week: dayOfWeek }, { onConflict: "day_of_week" })
    : supabase.from("school_weekly_off_days").delete().eq("day_of_week", dayOfWeek);
  const { error } = await query;
  if (error) throw error;
}

export async function listCalendarConfiguration(
  supabase: SupabaseClient,
  academicYearId: string,
  start: string,
  end: string,
): Promise<{ weeklyOffDays: number[]; overrides: CalendarOverride[] }> {
  const [{ data: weekly, error: weeklyError }, { data: overrides, error: overrideError }] = await Promise.all([
    supabase.from("school_weekly_off_days").select("day_of_week").order("day_of_week"),
    supabase
      .from("academic_calendar_days")
      .select("id, academic_year_id, calendar_date, is_working_day, label")
      .eq("academic_year_id", academicYearId)
      .gte("calendar_date", start)
      .lte("calendar_date", end),
  ]);
  if (weeklyError) throw weeklyError;
  if (overrideError) throw overrideError;
  return {
    weeklyOffDays: (weekly ?? []).map((row) => row.day_of_week as number),
    overrides: (overrides ?? []) as CalendarOverride[],
  };
}

export interface AlertFilters {
  severity?: string;
  category?: string;
  status?: string;
  statuses?: string[];
  classId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAlerts(supabase: SupabaseClient, filters: AlertFilters = {}) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  let query = supabase
    .from("management_alerts")
    .select("*", { count: "exact" })
    .order("last_detected_at", { ascending: false });
  if (filters.severity) query = query.eq("severity", filters.severity);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (!filters.status && filters.statuses?.length) query = query.in("status", filters.statuses);
  if (filters.classId) query = query.eq("class_id", filters.classId);
  if (filters.from) query = query.gte("last_detected_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte("last_detected_at", `${filters.to}T23:59:59.999Z`);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as ManagementAlert[], count: count ?? 0, page, pageSize };
}

export async function getAlertSummary(supabase: SupabaseClient, periodStart: string, periodEnd: string) {
  const [critical, warning, resolved] = await Promise.all([
    supabase
      .from("management_alerts")
      .select("id", { count: "exact", head: true })
      .in("status", ["OPEN", "ACKNOWLEDGED"])
      .eq("severity", "CRITICAL"),
    supabase
      .from("management_alerts")
      .select("id", { count: "exact", head: true })
      .in("status", ["OPEN", "ACKNOWLEDGED"])
      .eq("severity", "WARNING"),
    supabase
      .from("management_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "RESOLVED")
      .gte("resolved_at", `${periodStart}T00:00:00.000Z`)
      .lte("resolved_at", `${periodEnd}T23:59:59.999Z`),
  ]);
  for (const result of [critical, warning, resolved]) {
    if (result.error) throw result.error;
  }
  return {
    openCritical: critical.count ?? 0,
    openWarnings: warning.count ?? 0,
    resolvedThisPeriod: resolved.count ?? 0,
  };
}

/** Newly-detected alerts within a period — distinct from getAlertSummary's
 * "open right now" and "resolved in period" counts, for the Weekly Review's
 * New Alerts card. */
export async function countAlertsFirstDetected(
  supabase: SupabaseClient,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("management_alerts")
    .select("id", { count: "exact", head: true })
    .gte("first_detected_at", `${periodStart}T00:00:00.000Z`)
    .lte("first_detected_at", `${periodEnd}T23:59:59.999Z`);
  if (error) throw error;
  return count ?? 0;
}

/** Grouped, RLS-respecting count of active alerts per student, via the
 * count_active_management_alerts_by_student() SQL function — never loads
 * every alert row (repository.listAlerts is capped at pageSize 100) just
 * to count them, so this stays correct past 100 active alerts. */
export async function countActiveAlertsByStudent(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("count_active_management_alerts_by_student");
  if (error) throw error;
  return new Map((data ?? []).map((row: { student_id: string; alert_count: number }) => [row.student_id, Number(row.alert_count)]));
}

export async function getAlert(supabase: SupabaseClient, id: string): Promise<ManagementAlert | null> {
  const { data, error } = await supabase.from("management_alerts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as ManagementAlert | null;
}

export async function listAlertsByFingerprints(supabase: SupabaseClient, fingerprints: string[]) {
  if (fingerprints.length === 0) return [] as ManagementAlert[];
  const { data, error } = await supabase.from("management_alerts").select("*").in("fingerprint", fingerprints);
  if (error) throw error;
  return (data ?? []) as ManagementAlert[];
}

export async function listActiveAttendanceAlerts(supabase: SupabaseClient, academicYearId: string) {
  const { data, error } = await supabase
    .from("management_alerts")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .in("category", ["ATTENDANCE", "STAFF"])
    .in("status", ["OPEN", "ACKNOWLEDGED"]);
  if (error) throw error;
  return (data ?? []) as ManagementAlert[];
}

async function listActiveAlertsByCategory(supabase: SupabaseClient, academicYearId: string, category: string) {
  const { data, error } = await supabase
    .from("management_alerts")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .eq("category", category)
    .in("status", ["OPEN", "ACKNOWLEDGED"]);
  if (error) throw error;
  return (data ?? []) as ManagementAlert[];
}

export const listActiveAcademicAlerts = (supabase: SupabaseClient, academicYearId: string) =>
  listActiveAlertsByCategory(supabase, academicYearId, "ACADEMICS");
export const listActivePerformanceAlerts = (supabase: SupabaseClient, academicYearId: string) =>
  listActiveAlertsByCategory(supabase, academicYearId, "PERFORMANCE");
export const listActiveFeeAlerts = (supabase: SupabaseClient, academicYearId: string) =>
  listActiveAlertsByCategory(supabase, academicYearId, "FEES");

export async function upsertAlert(supabase: SupabaseClient, value: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("management_alerts")
    .upsert(value, { onConflict: "fingerprint" })
    .select("*")
    .single();
  if (error) throw error;
  return data as ManagementAlert;
}

export async function updateAlert(supabase: SupabaseClient, id: string, value: Record<string, unknown>) {
  const { data, error } = await supabase.from("management_alerts").update(value).eq("id", id).select("*").single();
  if (error) throw error;
  return data as ManagementAlert;
}

export async function insertAlertEvent(
  supabase: SupabaseClient,
  value: { alert_id: string; event_type: string; from_status?: string | null; to_status?: string | null; note?: string | null },
) {
  const { error } = await supabase.from("management_alert_events").insert(value);
  if (error) throw error;
}
