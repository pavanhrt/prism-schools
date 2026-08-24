import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import {
  attendanceTrend,
  alertRefreshDecision,
  buildWorkingDays,
  calculateAttendance,
  consecutiveAbsenceDays,
  lowAttendanceSeverity,
  isDateCoveredByApprovedLeave,
  previousComparablePeriod,
  studentAbsenceSeverity,
} from "./rules";
import type {
  AlertSeverity,
  ManagementAlert,
  ManagementOverview,
  StaffInsight,
  StudentInsight,
} from "./types";

const SETTING_DEFAULTS = {
  student_absence_warning_days: 3,
  student_absence_critical_days: 5,
  student_low_attendance_warning_pct: 75,
  student_low_attendance_critical_pct: 65,
  student_attendance_decline_points: 10,
  staff_absence_warning_days: 3,
} as const;

export interface AnalyticsFilters {
  academicYearId?: string;
  start?: string;
  end?: string;
  classId?: string;
  sectionId?: string;
}

function todayInSchoolTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function startOfMonth(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function groupBy<T>(values: T[], key: (value: T) => string) {
  const result = new Map<string, T[]>();
  for (const value of values) result.set(key(value), [...(result.get(key(value)) ?? []), value]);
  return result;
}

function maxSeverity(...values: (AlertSeverity | null)[]): AlertSeverity | null {
  if (values.includes("CRITICAL")) return "CRITICAL";
  if (values.includes("WARNING")) return "WARNING";
  if (values.includes("INFO")) return "INFO";
  return null;
}

function numericSettings(rows: Awaited<ReturnType<typeof repo.listSettings>>) {
  const values = { ...SETTING_DEFAULTS } as Record<keyof typeof SETTING_DEFAULTS, number>;
  for (const row of rows) {
    if (row.value_type === "numeric" && row.numeric_value !== null && row.setting_key in values) {
      values[row.setting_key as keyof typeof SETTING_DEFAULTS] = Number(row.numeric_value);
    }
  }
  return values;
}

function calculateStaffAttendance(
  staffId: string,
  records: { attendance_date: string; status: string }[],
  workingDays: string[],
  leave: { staff_id: string; start_date: string; end_date: string }[],
) {
  const allowed = new Set(workingDays);
  const relevant = records.filter(
    (record) =>
      allowed.has(record.attendance_date) &&
      record.status !== "leave" &&
      !isDateCoveredByApprovedLeave(staffId, record.attendance_date, leave),
  );
  if (relevant.length === 0) return { recordedDays: 0, presentEquivalent: 0, percentage: null };
  const presentEquivalent = relevant.reduce((total, record) => {
    if (record.status === "present" || record.status === "late") return total + 1;
    if (record.status === "half_day") return total + 0.5;
    return total;
  }, 0);
  return {
    recordedDays: relevant.length,
    presentEquivalent,
    percentage: Math.round((presentEquivalent / relevant.length) * 10_000) / 100,
  };
}

export async function getAttendanceIntelligence(
  supabase: SupabaseClient,
  filters: AnalyticsFilters = {},
) {
  const academicYear = filters.academicYearId
    ? await repo.getAcademicYear(supabase, filters.academicYearId)
    : await repo.getCurrentAcademicYear(supabase);
  const today = todayInSchoolTimezone();
  const start = filters.start ?? startOfMonth(today);
  const end = filters.end ?? today;
  if (!academicYear) {
    return { academicYear: null, start, end, studentInsights: [], staffInsights: [], settings: null, workingDays: [] };
  }
  if (start > end) throw new Error("Start date must be on or before end date.");

  const previous = previousComparablePeriod(start, end);
  const historyStart = [academicYear.start_date, previous.start].sort()[0];
  const [settingsRows, roster, attendance, staff, staffAttendance, leave, calendar] = await Promise.all([
    repo.listSettings(supabase),
    repo.listCurrentRoster(supabase, academicYear.id, filters.classId, filters.sectionId),
    repo.listStudentAttendance(supabase, academicYear.id, historyStart, end, filters.classId, filters.sectionId),
    repo.listActiveStaff(supabase),
    repo.listStaffAttendance(supabase, historyStart, end),
    repo.listApprovedLeave(supabase, historyStart, end),
    repo.listCalendarConfiguration(supabase, academicYear.id, historyStart, end),
  ]);
  const settings = numericSettings(settingsRows);
  const allWorkingDays = buildWorkingDays(historyStart, end, calendar.weeklyOffDays, calendar.overrides);
  const workingDays = allWorkingDays.filter((date) => date >= start && date <= end);
  const previousWorkingDays = allWorkingDays.filter((date) => date >= previous.start && date <= previous.end);
  const streakWorkingDays = allWorkingDays.filter((date) => date >= academicYear.start_date && date <= end);
  const attendanceByStudent = groupBy(attendance, (row) => row.student_id);

  const studentInsights: StudentInsight[] = roster.map((row) => {
    const records = attendanceByStudent.get(row.student_id) ?? [];
    const currentMetric = calculateAttendance(records, workingDays);
    const previousMetric = calculateAttendance(records, previousWorkingDays);
    const streak = consecutiveAbsenceDays(records, streakWorkingDays);
    const absenceSeverity = studentAbsenceSeverity(
      streak,
      settings.student_absence_warning_days,
      settings.student_absence_critical_days,
    );
    const lowSeverity = lowAttendanceSeverity(
      currentMetric.percentage,
      settings.student_low_attendance_warning_pct,
      settings.student_low_attendance_critical_pct,
    );
    const trend = attendanceTrend(
      currentMetric.percentage,
      previousMetric.percentage,
      settings.student_attendance_decline_points,
    );
    return {
      studentId: row.student_id,
      admissionNo: row.students.admission_no,
      studentName: `${row.students.first_name} ${row.students.last_name}`,
      classId: row.class_id,
      className: row.classes.name,
      sectionId: row.section_id,
      sectionName: row.sections.name,
      presentDays: currentMetric.presentEquivalent,
      recordedWorkingDays: currentMetric.recordedDays,
      attendancePercentage: currentMetric.percentage,
      previousPercentage: previousMetric.percentage,
      differencePoints: trend.differencePoints,
      consecutiveAbsenceDays: streak,
      trend: trend.status,
      severity: maxSeverity(absenceSeverity, lowSeverity, trend.status === "DECLINING" ? "WARNING" : null),
    };
  });

  const attendanceByStaff = groupBy(staffAttendance, (row) => row.staff_id);
  const staffInsights: StaffInsight[] = staff.map((row) => {
    const raw = attendanceByStaff.get(row.id) ?? [];
    const records = raw.map((record) => ({
      ...record,
      status: record.status === "absent" && isDateCoveredByApprovedLeave(row.id, record.attendance_date, leave) ? "leave" : record.status,
    }));
    const metric = calculateStaffAttendance(row.id, records, workingDays, leave);
    const streak = consecutiveAbsenceDays(records, streakWorkingDays);
    return {
      staffId: row.id,
      staffNo: row.staff_no,
      staffName: `${row.first_name} ${row.last_name}`,
      presentDays: metric.presentEquivalent,
      recordedWorkingDays: metric.recordedDays,
      attendancePercentage: metric.percentage,
      consecutiveAbsenceDays: streak,
      severity: streak >= settings.staff_absence_warning_days ? "WARNING" : null,
    };
  });

  return { academicYear, start, end, previous, studentInsights, staffInsights, settings, workingDays };
}

export async function getManagementOverview(supabase: SupabaseClient): Promise<ManagementOverview> {
  const analytics = await getAttendanceIntelligence(supabase);
  const alertResult = await repo.listAlerts(supabase, { pageSize: 100 });
  const open = alertResult.rows.filter((alert) => alert.status === "OPEN" || alert.status === "ACKNOWLEDGED");
  const resolved = alertResult.rows.filter(
    (alert) => alert.status === "RESOLVED" && alert.resolved_at && alert.resolved_at.slice(0, 10) >= analytics.start,
  );
  const today = analytics.end;

  if (!analytics.academicYear || !analytics.settings) {
    return {
      periodStart: analytics.start,
      periodEnd: analytics.end,
      academicYearId: null,
      academicYearLabel: null,
      schoolStatus: { openCritical: 0, openWarnings: 0, resolvedThisPeriod: 0 },
      students: {
        active: 0,
        presentToday: { value: null, dataAvailable: false },
        absentToday: { value: null, dataAvailable: false },
        attendanceTodayPercentage: { value: null, dataAvailable: false },
        absentWarning: 0,
        absentCritical: 0,
        belowWarning: 0,
        belowCritical: 0,
      },
      staff: {
        active: 0,
        presentToday: { value: null, dataAvailable: false },
        absentToday: { value: null, dataAvailable: false },
        attendancePercentage: { value: null, dataAvailable: false },
        absentWarning: 0,
      },
      evaluationMessage: "No current academic year is configured.",
    };
  }

  const [todayStudentRows, todayStaffRows, leave] = await Promise.all([
    repo.listStudentAttendance(supabase, analytics.academicYear.id, today, today),
    repo.listStaffAttendance(supabase, today, today),
    repo.listApprovedLeave(supabase, today, today),
  ]);
  const studentRecorded = todayStudentRows.length;
  const studentPresent = todayStudentRows.filter((row) => ["present", "late", "half_day"].includes(row.status)).length;
  const studentAbsent = todayStudentRows.filter((row) => row.status === "absent").length;
  const staffRecorded = todayStaffRows.filter(
    (row) => row.status !== "leave" && !isDateCoveredByApprovedLeave(row.staff_id, today, leave),
  );
  const staffPresent = staffRecorded.filter((row) => ["present", "late", "half_day"].includes(row.status)).length;
  const staffAbsent = staffRecorded.filter((row) => row.status === "absent").length;
  const studentData = analytics.studentInsights.some((row) => row.recordedWorkingDays > 0);
  const staffData = analytics.staffInsights.some((row) => row.recordedWorkingDays > 0);

  return {
    periodStart: analytics.start,
    periodEnd: analytics.end,
    academicYearId: analytics.academicYear.id,
    academicYearLabel: analytics.academicYear.year_label,
    schoolStatus: {
      openCritical: open.filter((alert) => alert.severity === "CRITICAL").length,
      openWarnings: open.filter((alert) => alert.severity === "WARNING").length,
      resolvedThisPeriod: resolved.length,
    },
    students: {
      active: analytics.studentInsights.length,
      presentToday: { value: studentRecorded ? studentPresent : null, dataAvailable: studentRecorded > 0 },
      absentToday: { value: studentRecorded ? studentAbsent : null, dataAvailable: studentRecorded > 0 },
      attendanceTodayPercentage: {
        value: studentRecorded ? Math.round((studentPresent / studentRecorded) * 10_000) / 100 : null,
        dataAvailable: studentRecorded > 0,
      },
      absentWarning: analytics.studentInsights.filter(
        (row) => row.consecutiveAbsenceDays >= analytics.settings.student_absence_warning_days,
      ).length,
      absentCritical: analytics.studentInsights.filter(
        (row) => row.consecutiveAbsenceDays >= analytics.settings.student_absence_critical_days,
      ).length,
      belowWarning: analytics.studentInsights.filter(
        (row) => row.attendancePercentage !== null && row.attendancePercentage < analytics.settings.student_low_attendance_warning_pct,
      ).length,
      belowCritical: analytics.studentInsights.filter(
        (row) => row.attendancePercentage !== null && row.attendancePercentage < analytics.settings.student_low_attendance_critical_pct,
      ).length,
    },
    staff: {
      active: analytics.staffInsights.length,
      presentToday: { value: staffRecorded.length ? staffPresent : null, dataAvailable: staffRecorded.length > 0 },
      absentToday: { value: staffRecorded.length ? staffAbsent : null, dataAvailable: staffRecorded.length > 0 },
      attendancePercentage: {
        value: staffData
          ? Math.round(
              (analytics.staffInsights.reduce((sum, row) => sum + row.presentDays, 0) /
                analytics.staffInsights.reduce((sum, row) => sum + row.recordedWorkingDays, 0)) *
                10_000,
            ) / 100
          : null,
        dataAvailable: staffData,
      },
      absentWarning: analytics.staffInsights.filter(
        (row) => row.consecutiveAbsenceDays >= analytics.settings.staff_absence_warning_days,
      ).length,
    },
    evaluationMessage: studentData || staffData ? null : "Insufficient attendance data to evaluate attendance rules.",
  };
}

interface AlertCandidate {
  fingerprint: string;
  rule_key: string;
  alert_type: string;
  category: "ATTENDANCE" | "STAFF";
  severity: AlertSeverity;
  entity_type: "student" | "staff";
  entity_id: string;
  student_id?: string;
  staff_id?: string;
  class_id?: string;
  section_id?: string;
  academic_year_id: string;
  period_start: string;
  period_end: string;
  title: string;
  message: string;
  current_value: number;
  threshold_value: number;
}

export async function refreshAttendanceAlerts(supabase: SupabaseClient) {
  const analytics = await getAttendanceIntelligence(supabase);
  if (!analytics.academicYear || !analytics.settings) return { created: 0, updated: 0, reopened: 0, resolved: 0 };
  const candidates: AlertCandidate[] = [];
  const ay = analytics.academicYear;
  const settings = analytics.settings;

  for (const row of analytics.studentInsights) {
    const absenceSeverity = studentAbsenceSeverity(
      row.consecutiveAbsenceDays,
      settings.student_absence_warning_days,
      settings.student_absence_critical_days,
    );
    if (absenceSeverity) {
      const threshold = absenceSeverity === "CRITICAL" ? settings.student_absence_critical_days : settings.student_absence_warning_days;
      candidates.push({
        fingerprint: `student_consecutive_absence:${row.studentId}:${ay.id}`,
        rule_key: "student_consecutive_absence",
        alert_type: "CONSECUTIVE_ABSENCE",
        category: "ATTENDANCE",
        severity: absenceSeverity,
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: analytics.start,
        period_end: analytics.end,
        title: `${row.studentName} has ${row.consecutiveAbsenceDays} consecutive absences`,
        message: `Triggered because ${row.studentName} was explicitly marked absent for ${row.consecutiveAbsenceDays} consecutive configured working days; the ${absenceSeverity.toLowerCase()} threshold is ${threshold} days. Data source: student attendance and the school working-day calendar.`,
        current_value: row.consecutiveAbsenceDays,
        threshold_value: threshold,
      });
    }
    const lowSeverity = lowAttendanceSeverity(
      row.attendancePercentage,
      settings.student_low_attendance_warning_pct,
      settings.student_low_attendance_critical_pct,
    );
    if (lowSeverity && row.attendancePercentage !== null) {
      const threshold = lowSeverity === "CRITICAL" ? settings.student_low_attendance_critical_pct : settings.student_low_attendance_warning_pct;
      candidates.push({
        fingerprint: `student_low_attendance:${row.studentId}:${ay.id}:${analytics.start}`,
        rule_key: "student_low_attendance",
        alert_type: "LOW_ATTENDANCE",
        category: "ATTENDANCE",
        severity: lowSeverity,
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: analytics.start,
        period_end: analytics.end,
        title: `${row.studentName} attendance is ${row.attendancePercentage}%`,
        message: `Triggered because attendance was ${row.attendancePercentage}%, below the configured ${threshold}% ${lowSeverity.toLowerCase()} threshold for ${analytics.start} to ${analytics.end}. Based on ${row.recordedWorkingDays} recorded working days; unrecorded days were excluded.`,
        current_value: row.attendancePercentage,
        threshold_value: threshold,
      });
    }
    if (row.trend === "DECLINING" && row.differencePoints !== null) {
      candidates.push({
        fingerprint: `student_attendance_decline:${row.studentId}:${ay.id}:${analytics.start}`,
        rule_key: "student_attendance_decline",
        alert_type: "ATTENDANCE_DECLINE",
        category: "ATTENDANCE",
        severity: "WARNING",
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: analytics.start,
        period_end: analytics.end,
        title: `${row.studentName} attendance declined ${Math.abs(row.differencePoints)} points`,
        message: `Triggered because attendance changed from ${row.previousPercentage}% to ${row.attendancePercentage}%, a ${row.differencePoints} percentage-point difference. The configured decline threshold is ${settings.student_attendance_decline_points} points.`,
        current_value: Math.abs(row.differencePoints),
        threshold_value: settings.student_attendance_decline_points,
      });
    }
  }

  for (const row of analytics.staffInsights) {
    if (row.consecutiveAbsenceDays >= settings.staff_absence_warning_days) {
      candidates.push({
        fingerprint: `staff_consecutive_absence:${row.staffId}:${ay.id}`,
        rule_key: "staff_consecutive_absence",
        alert_type: "STAFF_CONSECUTIVE_ABSENCE",
        category: "STAFF",
        severity: "WARNING",
        entity_type: "staff",
        entity_id: row.staffId,
        staff_id: row.staffId,
        academic_year_id: ay.id,
        period_start: analytics.start,
        period_end: analytics.end,
        title: `${row.staffName} has ${row.consecutiveAbsenceDays} consecutive absences`,
        message: `Triggered because ${row.staffName} was explicitly marked absent for ${row.consecutiveAbsenceDays} consecutive configured working days. Approved leave was excluded. The warning threshold is ${settings.staff_absence_warning_days} days.`,
        current_value: row.consecutiveAbsenceDays,
        threshold_value: settings.staff_absence_warning_days,
      });
    }
  }

  const existing = await repo.listAlertsByFingerprints(supabase, candidates.map((item) => item.fingerprint));
  const byFingerprint = new Map(existing.map((alert) => [alert.fingerprint, alert]));
  let created = 0;
  let updated = 0;
  let reopened = 0;
  for (const candidate of candidates) {
    const prior = byFingerprint.get(candidate.fingerprint);
    const decision = alertRefreshDecision(prior?.status ?? null);
    const isReopen = decision === "REOPEN";
    const alert = await repo.upsertAlert(supabase, {
      ...candidate,
      status: isReopen ? "OPEN" : prior?.status ?? "OPEN",
      first_detected_at: isReopen ? new Date().toISOString() : prior?.first_detected_at ?? new Date().toISOString(),
      last_detected_at: new Date().toISOString(),
      acknowledged_by: isReopen ? null : prior?.acknowledged_by ?? null,
      acknowledged_at: isReopen ? null : prior?.acknowledged_at ?? null,
      resolved_by: null,
      resolved_at: null,
    });
    const eventType = decision === "CREATE" ? "CREATED" : decision === "REOPEN" ? "REOPENED" : "UPDATED";
    await repo.insertAlertEvent(supabase, {
      alert_id: alert.id,
      event_type: eventType,
      from_status: prior?.status ?? null,
      to_status: alert.status,
    });
    if (!prior) created += 1;
    else if (isReopen) reopened += 1;
    else updated += 1;
  }

  const candidateFingerprints = new Set(candidates.map((item) => item.fingerprint));
  const active = await repo.listActiveAttendanceAlerts(supabase, ay.id);
  let resolved = 0;
  for (const alert of active) {
    if (candidateFingerprints.has(alert.fingerprint)) continue;
    const updatedAlert = await repo.updateAlert(supabase, alert.id, {
      status: "RESOLVED",
      resolved_at: new Date().toISOString(),
      resolved_by: null,
    });
    await repo.insertAlertEvent(supabase, {
      alert_id: updatedAlert.id,
      event_type: "AUTO_RESOLVED",
      from_status: alert.status,
      to_status: "RESOLVED",
      note: "The deterministic condition was no longer present during refresh.",
    });
    resolved += 1;
  }
  return { created, updated, reopened, resolved };
}

export async function transitionAlert(
  supabase: SupabaseClient,
  alert: ManagementAlert,
  status: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED",
  note?: string,
) {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const now = new Date().toISOString();
  const value: Record<string, unknown> = { status };
  if (status === "ACKNOWLEDGED") Object.assign(value, { acknowledged_by: userId, acknowledged_at: now });
  if (status === "RESOLVED" || status === "DISMISSED") Object.assign(value, { resolved_by: userId, resolved_at: now });
  const updated = await repo.updateAlert(supabase, alert.id, value);
  await repo.insertAlertEvent(supabase, {
    alert_id: alert.id,
    event_type: status,
    from_status: alert.status,
    to_status: status,
    note: note || null,
  });
  return updated;
}

export const listAlerts = repo.listAlerts;
export const listSettings = repo.listSettings;
export async function updateNumericSetting(supabase: SupabaseClient, settingKey: string, numericValue: number) {
  const rows = await repo.listSettings(supabase);
  const values = new Map(rows.map((row) => [row.setting_key, Number(row.numeric_value)]));
  values.set(settingKey, numericValue);
  const absenceWarning = values.get("student_absence_warning_days") ?? 3;
  const absenceCritical = values.get("student_absence_critical_days") ?? 5;
  const attendanceWarning = values.get("student_low_attendance_warning_pct") ?? 75;
  const attendanceCritical = values.get("student_low_attendance_critical_pct") ?? 65;
  if (absenceCritical < absenceWarning) throw new Error("Critical absence days must be greater than or equal to warning days.");
  if (attendanceCritical > attendanceWarning) throw new Error("Critical attendance percentage must be less than or equal to warning percentage.");
  if (attendanceWarning > 100 || attendanceCritical > 100) throw new Error("Attendance percentages cannot exceed 100.");
  await repo.updateNumericSetting(supabase, settingKey, numericValue);
}
export const listAcademicYears = repo.listAcademicYears;
export const listClassesAndSections = repo.listClassesAndSections;
