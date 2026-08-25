import type { SupabaseClient } from "@supabase/supabase-js";
import * as academicsService from "@/features/academics/service";
import * as examsService from "@/features/exams/service";
import * as feesService from "@/features/fees/service";
import * as teachingService from "@/features/teaching/service";
import type { ExamResult, ExamSchedule } from "@/types/exams";
import * as repo from "./repository";
import { summarizeAcademicDelivery } from "./academics";
import { paginateOverdueStudents, summarizeFees } from "./fees-intelligence";
import { isNewerComparableExam, selectPreviousComparableExam, summarizeClassPerformance, summarizeStudentPerformance } from "./performance";
import {
  addDays,
  attendanceTrend,
  alertRefreshDecision,
  buildWorkingDays,
  calculateAttendance,
  computeAttendanceOpportunityCoverage,
  computeCoverage,
  computeDailyCoverage,
  computeHealthScore,
  consecutiveAbsenceDays,
  expectedWorkingDaysExcludingLeave,
  feeCollectionRateBelowThreshold,
  feeCollectionRateRecovered,
  feeOverdueSeverity,
  healthLabel,
  lowAttendanceSeverity,
  isDateCoveredByApprovedLeave,
  isAlertTransitionAllowed,
  latestRecordedAttendanceEvaluation,
  previousComparablePeriod,
  studentAbsenceSeverity,
} from "./rules";
import type {
  AlertSeverity,
  DeliveryStatus,
  ManagementAlert,
  ManagementOverview,
  StaffInsight,
  StudentInsight,
  StudentPerformanceInsight,
} from "./types";

const SETTING_DEFAULTS = {
  student_absence_warning_days: 3,
  student_absence_critical_days: 5,
  student_low_attendance_warning_pct: 75,
  student_low_attendance_critical_pct: 65,
  student_attendance_decline_points: 10,
  staff_absence_warning_days: 3,
  academic_lag_slightly_behind_days: 1,
  academic_lag_warning_days: 4,
  academic_lag_critical_days: 8,
  performance_change_points: 3,
  performance_strong_change_points: 10,
  performance_attention_score_pct: 40,
  fee_overdue_warning_days: 7,
  fee_overdue_critical_days: 30,
  fee_significant_overdue_amount: 5000,
  fee_collection_rate_warning_pct: 60,
  health_weight_student_attendance: 25,
  health_weight_academic_progress: 25,
  health_weight_performance: 25,
  health_weight_staff_attendance: 10,
  health_weight_delivery: 10,
  health_weight_fees: 5,
} as const;

export interface AnalyticsFilters {
  academicYearId?: string;
  start?: string;
  end?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  includeStaff?: boolean;
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
    repo.listCurrentRoster(supabase, academicYear.id, filters.classId, filters.sectionId, filters.studentId),
    repo.listStudentAttendance(supabase, academicYear.id, historyStart, end, filters.classId, filters.sectionId, filters.studentId),
    filters.includeStaff === false ? Promise.resolve([]) : repo.listActiveStaff(supabase),
    filters.includeStaff === false ? Promise.resolve([]) : repo.listStaffAttendance(supabase, historyStart, end),
    filters.includeStaff === false ? Promise.resolve([]) : repo.listApprovedLeave(supabase, historyStart, end),
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
      latestRecordedAttendanceEvaluation: latestRecordedAttendanceEvaluation(records, streakWorkingDays),
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
      expectedWorkingDays: expectedWorkingDaysExcludingLeave(workingDays, row.id, leave),
      attendancePercentage: metric.percentage,
      consecutiveAbsenceDays: streak,
      latestRecordedAttendanceEvaluation: latestRecordedAttendanceEvaluation(records, streakWorkingDays),
      severity: streak >= settings.staff_absence_warning_days ? "WARNING" : null,
    };
  });

  return { academicYear, start, end, previous, studentInsights, staffInsights, settings, workingDays };
}

export async function getManagementOverview(supabase: SupabaseClient): Promise<ManagementOverview> {
  const analytics = await getAttendanceIntelligence(supabase);
  const alertSummary = await repo.getAlertSummary(supabase, analytics.start, analytics.end);
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
        coverageToday: computeCoverage(0, 0),
      },
      staff: {
        active: 0,
        expectedToday: 0,
        approvedLeaveToday: 0,
        presentToday: { value: null, dataAvailable: false },
        absentToday: { value: null, dataAvailable: false },
        attendancePercentage: { value: null, dataAvailable: false },
        absentWarning: 0,
        coverageToday: computeCoverage(0, 0),
      },
      todayIsWorkingDay: false,
      evaluationMessage: "No current academic year is configured.",
    };
  }

  const [todayStudentRows, todayStaffRows, leave] = await Promise.all([
    repo.listStudentAttendance(supabase, analytics.academicYear.id, today, today),
    repo.listStaffAttendance(supabase, today, today),
    repo.listApprovedLeave(supabase, today, today),
  ]);

  // Coverage/attendance-today figures must only ever reflect the ACTIVE
  // current-roster population. An attendance row for a student/staff member
  // outside that population (inactive, not currently enrolled, etc.) must
  // never inflate "recorded" — otherwise coverage can exceed 100%.
  const activeStudentIds = new Set(analytics.studentInsights.map((row) => row.studentId));
  const scopedTodayStudentRows = todayStudentRows.filter((row) => activeStudentIds.has(row.student_id));
  const studentRecorded = scopedTodayStudentRows.length;
  const studentPresent = scopedTodayStudentRows.filter((row) => ["present", "late", "half_day"].includes(row.status)).length;
  const studentTodayMetric = calculateAttendance(scopedTodayStudentRows, [today]);
  const studentAbsent = scopedTodayStudentRows.filter((row) => row.status === "absent").length;

  // Staff denominator excludes anyone on approved leave today — leave is
  // not absence, and it must not inflate "missing attendance" either.
  const activeStaffIds = new Set(analytics.staffInsights.map((row) => row.staffId));
  const approvedLeaveStaffIds = new Set(
    [...activeStaffIds].filter((staffId) => isDateCoveredByApprovedLeave(staffId, today, leave)),
  );
  const expectedStaffIds = new Set([...activeStaffIds].filter((staffId) => !approvedLeaveStaffIds.has(staffId)));
  const scopedTodayStaffRows = todayStaffRows.filter((row) => expectedStaffIds.has(row.staff_id) && row.status !== "leave");
  const staffRecorded = scopedTodayStaffRows.length;
  const staffPresent = scopedTodayStaffRows.filter((row) => ["present", "late", "half_day"].includes(row.status)).length;
  const staffAbsent = scopedTodayStaffRows.filter((row) => row.status === "absent").length;

  const studentData = analytics.studentInsights.some((row) => row.recordedWorkingDays > 0);
  const staffData = analytics.staffInsights.some((row) => row.recordedWorkingDays > 0);
  // analytics.end always equals `today` here (getAttendanceIntelligence was
  // called with no filters), so this working-days list already covers today.
  const todayIsWorkingDay = analytics.workingDays.includes(today);

  return {
    periodStart: analytics.start,
    periodEnd: analytics.end,
    academicYearId: analytics.academicYear.id,
    academicYearLabel: analytics.academicYear.year_label,
    schoolStatus: {
      ...alertSummary,
    },
    students: {
      active: analytics.studentInsights.length,
      presentToday: { value: studentRecorded ? studentPresent : null, dataAvailable: studentRecorded > 0 },
      absentToday: { value: studentRecorded ? studentAbsent : null, dataAvailable: studentRecorded > 0 },
      attendanceTodayPercentage: {
        value: studentTodayMetric.percentage,
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
      coverageToday: computeDailyCoverage(analytics.studentInsights.length, studentRecorded, todayIsWorkingDay),
    },
    staff: {
      active: analytics.staffInsights.length,
      expectedToday: expectedStaffIds.size,
      approvedLeaveToday: approvedLeaveStaffIds.size,
      presentToday: { value: staffRecorded ? staffPresent : null, dataAvailable: staffRecorded > 0 },
      absentToday: { value: staffRecorded ? staffAbsent : null, dataAvailable: staffRecorded > 0 },
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
      coverageToday: computeDailyCoverage(expectedStaffIds.size, staffRecorded, todayIsWorkingDay),
    },
    todayIsWorkingDay,
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

export function hasAttendanceResolutionEvidence(
  alert: ManagementAlert,
  studentInsights: StudentInsight[],
  staffInsights: StaffInsight[],
): boolean {
  if (alert.rule_key === "student_consecutive_absence") {
    return studentInsights.find((row) => row.studentId === alert.student_id)?.latestRecordedAttendanceEvaluation === "NON_ABSENT";
  }
  if (alert.rule_key === "student_low_attendance") {
    const row = studentInsights.find((item) => item.studentId === alert.student_id);
    return Boolean(row && row.attendancePercentage !== null);
  }
  if (alert.rule_key === "student_attendance_decline") {
    const row = studentInsights.find((item) => item.studentId === alert.student_id);
    return Boolean(row && row.differencePoints !== null);
  }
  if (alert.rule_key === "staff_consecutive_absence") {
    return staffInsights.find((row) => row.staffId === alert.staff_id)?.latestRecordedAttendanceEvaluation === "NON_ABSENT";
  }
  return false;
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
    if (!hasAttendanceResolutionEvidence(alert, analytics.studentInsights, analytics.staffInsights)) continue;
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
      note: "Positive attendance evidence showed that the deterministic condition was no longer present.",
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
  if (!isAlertTransitionAllowed(alert.status, status)) {
    throw new Error(`Cannot transition an alert from ${alert.status} to ${status}.`);
  }
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
export const listWeeklyOffDays = repo.listWeeklyOffDays;

export async function listStudentOptions(supabase: SupabaseClient, academicYearId?: string, classId?: string, sectionId?: string) {
  const academicYear = academicYearId
    ? await repo.getAcademicYear(supabase, academicYearId)
    : await repo.getCurrentAcademicYear(supabase);
  if (!academicYear) return [];
  const roster = await repo.listCurrentRoster(supabase, academicYear.id, classId, sectionId);
  return roster
    .map((row) => ({
      id: row.student_id,
      admissionNo: row.students.admission_no,
      name: `${row.students.first_name} ${row.students.last_name}`,
      className: row.classes.name,
      sectionName: row.sections.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function alertDestination(
  alert: Pick<ManagementAlert, "student_id" | "staff_id"> &
    Partial<Pick<ManagementAlert, "category" | "class_id" | "section_id" | "subject_id">>,
): string {
  if (alert.category === "PERFORMANCE" && alert.student_id) {
    return `/admin/management-intelligence/performance?student_id=${encodeURIComponent(alert.student_id)}`;
  }
  if (alert.category === "FEES" && alert.student_id) {
    return `/admin/students/${encodeURIComponent(alert.student_id)}`;
  }
  if (alert.category === "ACADEMICS" && alert.class_id) {
    const query = new URLSearchParams();
    query.set("class_id", alert.class_id);
    if (alert.section_id) query.set("section_id", alert.section_id);
    if (alert.subject_id) query.set("subject_id", alert.subject_id);
    return `/admin/management-intelligence/academics?${query.toString()}`;
  }
  if (alert.student_id) return `/admin/management-intelligence/attendance?student_id=${encodeURIComponent(alert.student_id)}`;
  if (alert.staff_id) return `/admin/staff/${encodeURIComponent(alert.staff_id)}`;
  return "/admin/management-intelligence/alerts";
}

// -----------------------------------------------------------------------------
// Phase 2: Academic Intelligence
// -----------------------------------------------------------------------------
export interface AcademicFilters {
  academicYearId?: string;
  end?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: DeliveryStatus;
  page?: number;
  pageSize?: number;
}

export async function getAcademicIntelligence(supabase: SupabaseClient, filters: AcademicFilters = {}) {
  const academicYear = filters.academicYearId
    ? await repo.getAcademicYear(supabase, filters.academicYearId)
    : await repo.getCurrentAcademicYear(supabase);
  const asOfDate = filters.end ?? todayInSchoolTimezone();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  if (!academicYear) return { academicYear: null, asOfDate, rows: [], pageRows: [], page, pageSize, totalCount: 0, settings: null };

  // KNOWN SCALABILITY LIMITATION: listTeacherAssignments/listLessonPlans
  // fetch every row across all academic years and filter to this year in
  // JS below, rather than a year-scoped SQL query. Acceptable at
  // single-school, structural-table scale (assignments/lesson plans are
  // bounded by class×subject count, not student count), but should become
  // a filtered query (mirroring listInvoicesForYear's pattern) if this
  // table grows large enough to matter. Not addressed in this pass per the
  // instruction not to redesign the whole analytics architecture here.
  const [settingsRows, assignments, lessonPlans, classesAndSections, subjects, teacherProfiles, calendar] = await Promise.all([
    repo.listSettings(supabase),
    teachingService.listTeacherAssignments(supabase),
    teachingService.listLessonPlans(supabase),
    repo.listClassesAndSections(supabase),
    academicsService.listSubjects(supabase),
    teachingService.listTeacherProfiles(supabase),
    repo.listCalendarConfiguration(supabase, academicYear.id, academicYear.start_date, asOfDate),
  ]);
  const settings = numericSettings(settingsRows);
  const workingDays = buildWorkingDays(academicYear.start_date, asOfDate, calendar.weeklyOffDays, calendar.overrides);

  const classById = new Map(classesAndSections.classes.map((item) => [item.id, item.name]));
  const sectionById = new Map(classesAndSections.sections.map((item) => [item.id, item.name]));
  const subjectById = new Map(subjects.map((item) => [item.id, item.name]));
  const teacherById = new Map(teacherProfiles.map((item) => [item.id, item.full_name]));

  const relevantAssignments = assignments.filter((item) => item.academic_year_id === academicYear.id && item.subject_id !== null);
  const yearLessonPlans = lessonPlans.filter((item) => item.academic_year_id === academicYear.id);

  // Filtering happens on individual assignment rows BEFORE grouping into
  // class+subject units, so e.g. filtering by section_id narrows to units
  // that include that section among their assignments, without ever
  // producing a separate unit per section.
  const filteredAssignments = relevantAssignments
    .filter(
      (item) =>
        (!filters.classId || item.class_id === filters.classId) &&
        (!filters.sectionId || item.section_id === filters.sectionId) &&
        (!filters.subjectId || item.subject_id === filters.subjectId) &&
        (!filters.teacherId || item.teacher_id === filters.teacherId),
    )
    .map((item) => ({
      classId: item.class_id,
      className: classById.get(item.class_id) ?? "Unknown class",
      sectionId: item.section_id,
      sectionName: sectionById.get(item.section_id) ?? "Unknown section",
      subjectId: item.subject_id as string,
      subjectName: subjectById.get(item.subject_id as string) ?? "Unknown subject",
      teacherId: item.teacher_id,
      teacherName: teacherById.get(item.teacher_id) ?? null,
    }));

  const insights = summarizeAcademicDelivery({
    assignments: filteredAssignments,
    lessonPlans: yearLessonPlans,
    asOfDate,
    workingDays,
    slightlyBehindDays: settings.academic_lag_slightly_behind_days,
    warningDays: settings.academic_lag_warning_days,
    criticalDays: settings.academic_lag_critical_days,
  });

  const filteredRows = filters.status ? insights.filter((item) => item.status === filters.status) : insights;
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return {
    academicYear,
    asOfDate,
    rows: filteredRows,
    pageRows,
    page,
    pageSize,
    totalCount: filteredRows.length,
    settings,
    classesAndSections,
    subjects,
    teacherProfiles,
  };
}

/** Positive resolution evidence for an academic lag alert: the class/subject
 * must still be evaluable (not INSUFFICIENT_DATA — a deleted lesson plan or
 * a removed assignment is missing data, not recovery) AND its lag must now
 * be below the warning threshold (ON_TRACK or SLIGHTLY_BEHIND). */
export function hasAcademicResolutionEvidence(status: DeliveryStatus | undefined): boolean {
  return status === "ON_TRACK" || status === "SLIGHTLY_BEHIND";
}

export async function refreshAcademicAlerts(supabase: SupabaseClient) {
  const analytics = await getAcademicIntelligence(supabase);
  if (!analytics.academicYear || !analytics.settings) return { created: 0, updated: 0, reopened: 0, resolved: 0 };
  const ay = analytics.academicYear;
  const candidates: {
    fingerprint: string;
    rule_key: string;
    alert_type: string;
    category: "ACADEMICS";
    severity: AlertSeverity;
    entity_type: "class_subject";
    entity_id: null;
    class_id: string;
    section_id: null;
    subject_id: string;
    academic_year_id: string;
    period_start: string;
    period_end: string;
    title: string;
    message: string;
    current_value: number;
    threshold_value: number;
  }[] = [];

  // One alert per class+subject — matching the one-unit-per-class+subject
  // evidence model. section_id is deliberately excluded from the
  // fingerprint/uniqueness key: 3 sections sharing one class+subject lag
  // must produce exactly ONE active alert, not one per section.
  for (const row of analytics.rows) {
    if (row.status === "WARNING" || row.status === "CRITICAL") {
      const threshold = row.status === "CRITICAL" ? analytics.settings.academic_lag_critical_days : analytics.settings.academic_lag_warning_days;
      const sectionNames = row.assignedSections.map((s) => s.sectionName).join(", ") || "no assigned section";
      candidates.push({
        fingerprint: `academic_subject_lag:${ay.id}:${row.classId}:${row.subjectId}`,
        rule_key: row.status === "CRITICAL" ? "subject_lag_critical" : "subject_lag_warning",
        alert_type: "ACADEMIC_DELIVERY_LAG",
        category: "ACADEMICS",
        severity: row.status,
        entity_type: "class_subject",
        entity_id: null,
        class_id: row.classId,
        section_id: null,
        subject_id: row.subjectId,
        academic_year_id: ay.id,
        period_start: analytics.academicYear.start_date,
        period_end: analytics.asOfDate,
        title: `${row.subjectName} (${row.className}) is ${row.lagDays} working days behind plan`,
        message: `Triggered because the oldest incomplete lesson plan for ${row.subjectName} in ${row.className} is ${row.lagDays} working days overdue, at or above the configured ${threshold}-day ${row.status.toLowerCase()} threshold. Affects sections: ${sectionNames}. Data source: lesson_plans.status and the school working-day calendar.`,
        current_value: row.lagDays ?? 0,
        threshold_value: threshold,
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
    await repo.insertAlertEvent(supabase, {
      alert_id: alert.id,
      event_type: decision === "CREATE" ? "CREATED" : decision === "REOPEN" ? "REOPENED" : "UPDATED",
      from_status: prior?.status ?? null,
      to_status: alert.status,
    });
    if (!prior) created += 1;
    else if (isReopen) reopened += 1;
    else updated += 1;
  }

  const candidateFingerprints = new Set(candidates.map((item) => item.fingerprint));
  const rowByKey = new Map(analytics.rows.map((row) => [`${row.classId}:${row.subjectId}`, row]));
  const active = await repo.listActiveAcademicAlerts(supabase, ay.id);
  let resolved = 0;
  for (const alert of active) {
    if (candidateFingerprints.has(alert.fingerprint)) continue;
    const currentRow = rowByKey.get(`${alert.class_id}:${alert.subject_id}`);
    if (!hasAcademicResolutionEvidence(currentRow?.status)) continue; // missing/insufficient data is not recovery evidence
    const updatedAlert = await repo.updateAlert(supabase, alert.id, { status: "RESOLVED", resolved_at: new Date().toISOString(), resolved_by: null });
    await repo.insertAlertEvent(supabase, {
      alert_id: updatedAlert.id,
      event_type: "AUTO_RESOLVED",
      from_status: alert.status,
      to_status: "RESOLVED",
      note: "The subject's delivery lag is evaluated and now below the warning threshold.",
    });
    resolved += 1;
  }
  return { created, updated, reopened, resolved };
}

// -----------------------------------------------------------------------------
// Phase 2: Performance Intelligence
// -----------------------------------------------------------------------------
export interface PerformanceFilters {
  academicYearId?: string;
  termId?: string;
  examId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  studentId?: string;
  trend?: string;
  page?: number;
  pageSize?: number;
}

function examResultToRow(result: ExamResult, scheduleById: Map<string, ExamSchedule>, subjectById: Map<string, string>) {
  const schedule = scheduleById.get(result.exam_schedule_id)!;
  return {
    studentId: result.student_id,
    subjectId: schedule.subject_id,
    subjectName: subjectById.get(schedule.subject_id) ?? "Unknown subject",
    marksTheory: result.marks_theory,
    marksPractical: result.marks_practical,
    maxMarksTheory: schedule.max_marks_theory,
    maxMarksPractical: schedule.max_marks_practical,
    passMarks: schedule.pass_marks,
  };
}

export async function getPerformanceIntelligence(supabase: SupabaseClient, filters: PerformanceFilters = {}) {
  const academicYear = filters.academicYearId
    ? await repo.getAcademicYear(supabase, filters.academicYearId)
    : await repo.getCurrentAcademicYear(supabase);
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);
  const empty = {
    academicYear: null as Awaited<ReturnType<typeof repo.getAcademicYear>>,
    terms: [] as Awaited<ReturnType<typeof examsService.listExamTerms>>,
    exams: [] as Awaited<ReturnType<typeof examsService.listExams>>,
    selectedExam: null as Awaited<ReturnType<typeof examsService.listExams>>[number] | null,
    previousExam: null as Awaited<ReturnType<typeof examsService.listExams>>[number] | null,
    insights: [] as ReturnType<typeof summarizeStudentPerformance>,
    pageInsights: [] as ReturnType<typeof summarizeStudentPerformance>,
    page,
    pageSize,
    totalCount: 0,
    classSummary: [] as ReturnType<typeof summarizeClassPerformance>,
    settings: null as ReturnType<typeof numericSettings> | null,
    subjects: [] as Awaited<ReturnType<typeof academicsService.listSubjects>>,
  };
  if (!academicYear) return empty;

  // KNOWN SCALABILITY LIMITATION: listExamTerms/listExams/listExamSchedules
  // fetch every row across all academic years/exams and are filtered to
  // this year in JS below, rather than a year-scoped SQL query. These are
  // structural tables bounded by exam×class×subject count (not student
  // count), so acceptable at single-school scale. exam_results itself
  // IS fetched scoped (listResultsForSchedules, id-filtered) — the
  // student-volume-bearing table is not part of this limitation. Not
  // addressed further here per the instruction not to redesign the whole
  // analytics architecture in this pass.
  const [settingsRows, terms, exams, schedules, gradeScales, roster, subjects] = await Promise.all([
    repo.listSettings(supabase),
    examsService.listExamTerms(supabase),
    examsService.listExams(supabase),
    examsService.listExamSchedules(supabase),
    examsService.listGradeScales(supabase),
    repo.listCurrentRoster(supabase, academicYear.id, filters.classId, filters.sectionId, filters.studentId),
    academicsService.listSubjects(supabase),
  ]);
  const settings = numericSettings(settingsRows);
  const subjectById = new Map(subjects.map((item) => [item.id, item.name]));

  const yearTerms = terms.filter((term) => term.academic_year_id === academicYear.id);
  const yearTermIds = new Set(yearTerms.map((term) => term.id));
  const authoritativeSchedules = schedules.filter((schedule) => schedule.result_status === "published" || schedule.result_status === "locked");
  const schedulesByExam = groupBy(authoritativeSchedules, (schedule) => schedule.exam_id);

  // DISPLAY/SELECTABLE exams are narrowed by the Term filter (what the user
  // is currently viewing). COMPARISON CANDIDATES are never narrowed by it —
  // the previous comparable exam is searched across the WHOLE academic
  // year, so a Term 2 selection can still find its comparator in Term 1
  // (Phase 2C fix: the Term filter must not accidentally hide a valid
  // comparator that happens to live in a different term).
  const allExamsWithResults = [...exams].filter((exam) => yearTermIds.has(exam.term_id) && (schedulesByExam.get(exam.id) ?? []).length > 0);
  const termIdsInScope = filters.termId ? new Set([filters.termId]) : yearTermIds;
  const examsWithResults = allExamsWithResults.filter((exam) => termIdsInScope.has(exam.term_id));

  if (examsWithResults.length === 0) return { ...empty, academicYear, terms: yearTerms, settings, subjects };

  const selectedExam =
    (filters.examId && examsWithResults.find((exam) => exam.id === filters.examId)) ||
    [...examsWithResults].sort((a, b) => a.created_at.localeCompare(b.created_at))[examsWithResults.length - 1];

  // Comparability is EXPLICIT ONLY — see selectPreviousComparableExam in
  // ./performance.ts. created_at, exam name text, and term ordering are
  // never used to infer it. The candidate pool is the full-year set, not
  // the term-filtered display set.
  const comparableCandidate = selectPreviousComparableExam(
    { id: selectedExam.id, comparisonGroup: selectedExam.comparison_group, sequenceNo: selectedExam.sequence_no },
    allExamsWithResults.map((exam) => ({ id: exam.id, comparisonGroup: exam.comparison_group, sequenceNo: exam.sequence_no })),
  );
  const previousExam = comparableCandidate ? allExamsWithResults.find((exam) => exam.id === comparableCandidate.id)! : null;

  const scopeFilter = (schedule: (typeof authoritativeSchedules)[number]) =>
    (!filters.classId || schedule.class_id === filters.classId) && (!filters.subjectId || schedule.subject_id === filters.subjectId);
  const selectedSchedules = (schedulesByExam.get(selectedExam.id) ?? []).filter(scopeFilter);
  const previousSchedules = previousExam ? (schedulesByExam.get(previousExam.id) ?? []).filter(scopeFilter) : [];
  const scheduleById = new Map([...selectedSchedules, ...previousSchedules].map((schedule) => [schedule.id, schedule]));

  const [selectedResults, previousResults] = await Promise.all([
    examsService.listResultsForSchedules(supabase, selectedSchedules.map((schedule) => schedule.id)),
    examsService.listResultsForSchedules(supabase, previousSchedules.map((schedule) => schedule.id)),
  ]);

  const rosterEntries = roster.map((item) => ({
    studentId: item.student_id,
    admissionNo: item.students.admission_no,
    studentName: `${item.students.first_name} ${item.students.last_name}`,
    classId: item.class_id,
    className: item.classes.name,
    sectionId: item.section_id,
    sectionName: item.sections.name,
  }));

  // Ranking is computed here, over the FULL relevant roster, before any
  // trend filter or pagination slice — so class rank stays correct for the
  // whole class even when the table below only renders one page of it.
  let insights = summarizeStudentPerformance({
    roster: rosterEntries,
    selectedExamId: selectedExam.id,
    selectedExamName: selectedExam.name,
    selectedExamResults: selectedResults.map((result) => examResultToRow(result, scheduleById, subjectById)),
    previousExamResults: previousResults.map((result) => examResultToRow(result, scheduleById, subjectById)),
    gradeScales,
    changePoints: settings.performance_change_points,
    strongChangePoints: settings.performance_strong_change_points,
    attentionScorePct: settings.performance_attention_score_pct,
  });

  const classSummary = summarizeClassPerformance(insights);
  if (filters.trend) insights = insights.filter((item) => item.trend === filters.trend);
  const totalCount = insights.length;
  const pageInsights = insights.slice((page - 1) * pageSize, page * pageSize);

  return {
    academicYear,
    terms: yearTerms,
    exams: examsWithResults,
    selectedExam,
    previousExam,
    insights,
    pageInsights,
    page,
    pageSize,
    totalCount,
    classSummary,
    settings,
    subjects,
  };
}

/** Positive resolution evidence for a performance alert: the student must
 * have an actual evaluated result in the newer exam (missing data is not
 * evidence) and, per rule, the specific condition must no longer hold —
 * for a decline alert this means a genuinely comparable, non-declining
 * trend (STABLE/IMPROVING/STRONGLY_IMPROVING), never INSUFFICIENT_DATA. */
export function hasPerformanceResolutionEvidence(
  ruleKey: string,
  row: Pick<StudentPerformanceInsight, "latestOverallPercentage" | "trend" | "failedSubjects" | "subjectsRequiringAttention">,
): boolean {
  if (row.latestOverallPercentage === null) return false;
  if (ruleKey === "student_performance_decline") {
    return row.trend === "STABLE" || row.trend === "IMPROVING" || row.trend === "STRONGLY_IMPROVING";
  }
  if (ruleKey === "failed_subjects") return row.failedSubjects.length === 0;
  if (ruleKey === "multiple_subject_decline") return row.subjectsRequiringAttention.length < 2;
  return false;
}

export async function refreshPerformanceAlerts(supabase: SupabaseClient) {
  const analytics = await getPerformanceIntelligence(supabase);
  if (!analytics.academicYear || !analytics.selectedExam || !analytics.settings) return { created: 0, updated: 0, reopened: 0, resolved: 0 };
  const ay = analytics.academicYear;
  const exam = analytics.selectedExam;
  const candidates: {
    fingerprint: string;
    rule_key: string;
    alert_type: string;
    category: "PERFORMANCE";
    severity: AlertSeverity;
    entity_type: "student";
    entity_id: string;
    student_id: string;
    class_id: string;
    section_id: string;
    academic_year_id: string;
    period_start: string;
    period_end: string;
    title: string;
    message: string;
    current_value: number;
    threshold_value: number;
  }[] = [];

  for (const row of analytics.insights) {
    if (row.trend === "DECLINING" || row.trend === "STRONGLY_DECLINING") {
      candidates.push({
        fingerprint: `student_performance_decline:${ay.id}:${exam.id}:${row.studentId}`,
        rule_key: "student_performance_decline",
        alert_type: "PERFORMANCE_DECLINE",
        category: "PERFORMANCE",
        severity: row.trend === "STRONGLY_DECLINING" ? "CRITICAL" : "WARNING",
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: exam.created_at.slice(0, 10),
        period_end: exam.created_at.slice(0, 10),
        title: `${row.studentName} performance changed ${row.differencePoints} points in ${exam.name}`,
        message: `Triggered because overall performance (on subjects common to both exams) changed from ${row.previousComparablePercentage}% to ${row.currentComparablePercentage}% (${row.differencePoints} percentage points) between the previous comparable exam and ${exam.name}.`,
        current_value: Math.abs(row.differencePoints ?? 0),
        threshold_value: analytics.settings.performance_change_points,
      });
    }
    if (row.failedSubjects.length > 0) {
      candidates.push({
        fingerprint: `student_failed_subjects:${ay.id}:${exam.id}:${row.studentId}`,
        rule_key: "failed_subjects",
        alert_type: "FAILED_SUBJECTS",
        category: "PERFORMANCE",
        severity: row.failedSubjects.length > 1 ? "CRITICAL" : "WARNING",
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: exam.created_at.slice(0, 10),
        period_end: exam.created_at.slice(0, 10),
        title: `${row.studentName} is failing ${row.failedSubjects.length} subject${row.failedSubjects.length > 1 ? "s" : ""} in ${exam.name}`,
        message: `Triggered because ${row.studentName} scored below the pass mark in: ${row.failedSubjects.join(", ")}, in the published/locked results for ${exam.name}.`,
        current_value: row.failedSubjects.length,
        threshold_value: 1,
      });
    } else if (row.subjectsRequiringAttention.length >= 2) {
      candidates.push({
        fingerprint: `student_multiple_subject_decline:${ay.id}:${exam.id}:${row.studentId}`,
        rule_key: "multiple_subject_decline",
        alert_type: "MULTIPLE_SUBJECT_ATTENTION",
        category: "PERFORMANCE",
        severity: "WARNING",
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        class_id: row.classId,
        section_id: row.sectionId,
        academic_year_id: ay.id,
        period_start: exam.created_at.slice(0, 10),
        period_end: exam.created_at.slice(0, 10),
        title: `${row.studentName} has ${row.subjectsRequiringAttention.length} subjects requiring attention in ${exam.name}`,
        message: row.subjectsRequiringAttention.map((item) => item.reason).join(" "),
        current_value: row.subjectsRequiringAttention.length,
        threshold_value: 2,
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
    await repo.insertAlertEvent(supabase, {
      alert_id: alert.id,
      event_type: decision === "CREATE" ? "CREATED" : decision === "REOPEN" ? "REOPENED" : "UPDATED",
      from_status: prior?.status ?? null,
      to_status: alert.status,
    });
    if (!prior) created += 1;
    else if (isReopen) reopened += 1;
    else updated += 1;
  }

  // Auto-resolve requires explicit NEWER authoritative comparable evidence
  // for the SAME student — never just "the candidate set moved on". The
  // fingerprint embeds the exam it was raised against (rule_key:academic_
  // year_id:exam_id:student_id; none of those segments can contain ':'),
  // so an alert only becomes eligible once a genuinely newer exam is the
  // one being evaluated, and only resolves if that newer exam's evaluated
  // result shows the specific condition has cleared.
  // Phase 2C: "newer" alone is not sufficient — the exam now being
  // evaluated must be genuinely comparable (same comparison_group, higher
  // sequence_no) to the exam the alert was originally raised against. A
  // later but unrelated exam (e.g. a Weekly Test after a Term Exam) must
  // never resolve a Term Exam decline alert.
  const candidateFingerprints = new Set(candidates.map((item) => item.fingerprint));
  const insightByStudent = new Map(analytics.insights.map((row) => [row.studentId, row]));
  const examById = new Map(analytics.exams.map((item) => [item.id, item]));
  const currentExamCandidate = { id: exam.id, comparisonGroup: exam.comparison_group, sequenceNo: exam.sequence_no };
  const active = await repo.listActivePerformanceAlerts(supabase, ay.id);
  let resolved = 0;
  for (const alert of active) {
    if (candidateFingerprints.has(alert.fingerprint)) continue;
    const alertExamId = alert.fingerprint.split(":")[2];
    const alertExam = examById.get(alertExamId);
    const alertExamCandidate = alertExam ? { id: alertExam.id, comparisonGroup: alertExam.comparison_group, sequenceNo: alertExam.sequence_no } : undefined;
    if (!isNewerComparableExam(alertExamCandidate, currentExamCandidate)) continue;
    const currentRow = alert.student_id ? insightByStudent.get(alert.student_id) : undefined;
    if (!currentRow || !hasPerformanceResolutionEvidence(alert.rule_key, currentRow)) continue;
    const updatedAlert = await repo.updateAlert(supabase, alert.id, { status: "RESOLVED", resolved_at: new Date().toISOString(), resolved_by: null });
    await repo.insertAlertEvent(supabase, {
      alert_id: updatedAlert.id,
      event_type: "AUTO_RESOLVED",
      from_status: alert.status,
      to_status: "RESOLVED",
      note: `A newer comparable, authoritative evaluation (${exam.name}) shows the condition has cleared.`,
    });
    resolved += 1;
  }
  return { created, updated, reopened, resolved };
}

// -----------------------------------------------------------------------------
// Phase 2: Fee Intelligence
// -----------------------------------------------------------------------------
export interface FeeFilters {
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  feeTypeId?: string;
  /** Invoice due_date range — explicit to avoid ambiguity with payment
   * date. There is no separate payment-date filter in this dashboard;
   * Monthly Collection already breaks payments down by calendar month. */
  dueDateFrom?: string;
  dueDateTo?: string;
  overdueSeverity?: AlertSeverity;
  overduePage?: number;
  overduePageSize?: number;
}

export async function getFeeIntelligence(supabase: SupabaseClient, filters: FeeFilters = {}) {
  const academicYear = filters.academicYearId
    ? await repo.getAcademicYear(supabase, filters.academicYearId)
    : await repo.getCurrentAcademicYear(supabase);
  const today = todayInSchoolTimezone();

  // Scoped to one academic year at the database level — never a full
  // school-history fetch — and further scoped to a class/section roster
  // in-memory only after that (roster size is bounded by one class/year).
  const [settingsRows, invoices, feeTypes, roster] = await Promise.all([
    repo.listSettings(supabase),
    academicYear ? feesService.listInvoicesForYear(supabase, academicYear.id, filters.dueDateFrom, filters.dueDateTo) : Promise.resolve([]),
    feesService.listFeeTypes(supabase),
    academicYear ? repo.listCurrentRoster(supabase, academicYear.id, filters.classId, filters.sectionId) : Promise.resolve([]),
  ]);
  const settings = numericSettings(settingsRows);
  const rosterMap = new Map(
    roster.map((item) => [
      item.student_id,
      {
        admissionNo: item.students.admission_no,
        studentName: `${item.students.first_name} ${item.students.last_name}`,
        classId: item.class_id,
        className: item.classes.name,
        sectionId: item.section_id,
        sectionName: item.sections.name,
      },
    ]),
  );
  const isClassScoped = Boolean(filters.classId || filters.sectionId);
  let scopedInvoices = invoices.filter((invoice) => !isClassScoped || rosterMap.has(invoice.student_id));

  const invoiceIds = scopedInvoices.map((invoice) => invoice.id);
  const [payments, allInvoiceItems] = await Promise.all([
    feesService.listPaymentsForInvoices(supabase, invoiceIds),
    feesService.listInvoiceItemsForInvoices(supabase, invoiceIds),
  ]);

  if (filters.feeTypeId) {
    const invoiceIdsWithFeeType = new Set(allInvoiceItems.filter((item) => item.fee_type_id === filters.feeTypeId).map((item) => item.invoice_id));
    scopedInvoices = scopedInvoices.filter((invoice) => invoiceIdsWithFeeType.has(invoice.id));
  }
  const scopedInvoiceIdSet = new Set(scopedInvoices.map((invoice) => invoice.id));
  const invoiceItems = allInvoiceItems.filter((item) => scopedInvoiceIdSet.has(item.invoice_id));
  const scopedPayments = payments.filter((payment) => scopedInvoiceIdSet.has(payment.invoice_id));

  const result = summarizeFees({
    invoices: scopedInvoices,
    payments: scopedPayments,
    invoiceItems,
    feeTypeNames: new Map(feeTypes.map((item) => [item.id, item.name])),
    roster: rosterMap,
    today,
    overdueWarningDays: settings.fee_overdue_warning_days,
    overdueCriticalDays: settings.fee_overdue_critical_days,
  });
  const scopedOverdueStudents = filters.overdueSeverity
    ? result.overdueStudents.filter((row) => row.severity === filters.overdueSeverity)
    : result.overdueStudents;
  const overdueStudentsPage = paginateOverdueStudents(scopedOverdueStudents, filters.overduePage, filters.overduePageSize);

  return { academicYear, today, settings, ...result, overdueStudentsPage };
}

export async function refreshFeeAlerts(supabase: SupabaseClient) {
  const analytics = await getFeeIntelligence(supabase);
  if (!analytics.academicYear || !analytics.settings) return { created: 0, updated: 0, reopened: 0, resolved: 0 };
  const ay = analytics.academicYear;
  const settings = analytics.settings;
  const candidates: {
    fingerprint: string;
    rule_key: string;
    alert_type: string;
    category: "FEES";
    severity: AlertSeverity;
    entity_type: "student" | "academic_year";
    entity_id: string;
    student_id?: string;
    academic_year_id: string;
    period_start: string;
    period_end: string;
    title: string;
    message: string;
    current_value: number;
    threshold_value: number;
  }[] = [];

  for (const row of analytics.overdueStudents) {
    const severity = feeOverdueSeverity(row.overdueDays, settings.fee_overdue_warning_days, settings.fee_overdue_critical_days);
    if (!severity) continue;
    candidates.push({
      fingerprint: `fee_overdue:${row.studentId}:${row.invoiceId}`,
      rule_key: "fee_overdue",
      alert_type: "FEE_OVERDUE",
      category: "FEES",
      severity,
      entity_type: "student",
      entity_id: row.studentId,
      student_id: row.studentId,
      academic_year_id: ay.id,
      period_start: row.dueDate,
      period_end: analytics.today,
      title: `${row.studentName} has an overdue balance of ${row.balance} (${row.overdueDays} days)`,
      message: `Triggered because invoice ${row.invoiceNo} has an outstanding balance of ${row.balance}, ${row.overdueDays} days past its due date of ${row.dueDate}.`,
      current_value: row.overdueDays,
      threshold_value: settings.fee_overdue_warning_days,
    });
    if (row.balance >= settings.fee_significant_overdue_amount) {
      candidates.push({
        fingerprint: `significant_fee_overdue:${row.studentId}:${row.invoiceId}`,
        rule_key: "significant_fee_overdue",
        alert_type: "SIGNIFICANT_FEE_OVERDUE",
        category: "FEES",
        severity: "CRITICAL",
        entity_type: "student",
        entity_id: row.studentId,
        student_id: row.studentId,
        academic_year_id: ay.id,
        period_start: row.dueDate,
        period_end: analytics.today,
        title: `${row.studentName} has a significant overdue balance of ${row.balance}`,
        message: `Triggered because the overdue balance of ${row.balance} on invoice ${row.invoiceNo} is at or above the configured significant-overdue amount of ${settings.fee_significant_overdue_amount}.`,
        current_value: row.balance,
        threshold_value: settings.fee_significant_overdue_amount,
      });
    }
  }

  // Collection-rate warning: only created when there is actual invoice data
  // to evaluate — a school with zero invoices this year is NOT_RECORDED,
  // never misread as a 0% collection crisis.
  if (feeCollectionRateBelowThreshold(analytics.summary.dataCoverage, analytics.summary.collectionPercentage, settings.fee_collection_rate_warning_pct)) {
    candidates.push({
      fingerprint: `fee_collection_rate:${ay.id}`,
      rule_key: "fee_collection_rate_warning",
      alert_type: "FEE_COLLECTION_RATE_WARNING",
      category: "FEES",
      severity: "WARNING",
      entity_type: "academic_year",
      entity_id: ay.id,
      academic_year_id: ay.id,
      period_start: ay.start_date,
      period_end: analytics.today,
      title: `Fee collection rate is ${analytics.summary.collectionPercentage}%, below the ${settings.fee_collection_rate_warning_pct}% threshold`,
      message: `Triggered because the academic year's overall collection percentage (${analytics.summary.collectionPercentage}%, across ${analytics.summary.invoiceCount} invoices) is below the configured ${settings.fee_collection_rate_warning_pct}% warning threshold.`,
      current_value: analytics.summary.collectionPercentage!,
      threshold_value: settings.fee_collection_rate_warning_pct,
    });
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
    await repo.insertAlertEvent(supabase, {
      alert_id: alert.id,
      event_type: decision === "CREATE" ? "CREATED" : decision === "REOPEN" ? "REOPENED" : "UPDATED",
      from_status: prior?.status ?? null,
      to_status: alert.status,
    });
    if (!prior) created += 1;
    else if (isReopen) reopened += 1;
    else updated += 1;
  }

  // AUTO_RESOLVE: an overdue-fee alert clears once a full, complete refresh
  // of this year's invoices no longer includes it (fee invoices/payments
  // have no "insufficient data" state the way academics/performance do —
  // an invoice either exists with a computable balance or it doesn't).
  // The collection-rate alert is the exception: it must only resolve on
  // explicit recovery evidence (collectionPercentage back at/above
  // threshold), never merely because invoice data went missing.
  const candidateFingerprints = new Set(candidates.map((item) => item.fingerprint));
  const active = await repo.listActiveFeeAlerts(supabase, ay.id);
  let resolved = 0;
  for (const alert of active) {
    if (candidateFingerprints.has(alert.fingerprint)) continue;
    if (alert.rule_key === "fee_collection_rate_warning") {
      if (!feeCollectionRateRecovered(analytics.summary.dataCoverage, analytics.summary.collectionPercentage, settings.fee_collection_rate_warning_pct)) continue;
    }
    const updatedAlert = await repo.updateAlert(supabase, alert.id, { status: "RESOLVED", resolved_at: new Date().toISOString(), resolved_by: null });
    await repo.insertAlertEvent(supabase, {
      alert_id: updatedAlert.id,
      event_type: "AUTO_RESOLVED",
      from_status: alert.status,
      to_status: "RESOLVED",
      note:
        alert.rule_key === "fee_collection_rate_warning"
          ? `Collection percentage recovered to ${analytics.summary.collectionPercentage}%, at or above the ${settings.fee_collection_rate_warning_pct}% threshold.`
          : "The invoice no longer carries an overdue balance.",
    });
    resolved += 1;
  }
  return { created, updated, reopened, resolved };
}

function sumRefresh(...results: { created: number; updated: number; reopened: number; resolved: number }[]) {
  return results.reduce(
    (total, item) => ({
      created: total.created + item.created,
      updated: total.updated + item.updated,
      reopened: total.reopened + item.reopened,
      resolved: total.resolved + item.resolved,
    }),
    { created: 0, updated: 0, reopened: 0, resolved: 0 },
  );
}

export async function refreshAllAlerts(supabase: SupabaseClient) {
  const [attendance, academic, performance, fees] = await Promise.all([
    refreshAttendanceAlerts(supabase),
    refreshAcademicAlerts(supabase),
    refreshPerformanceAlerts(supabase),
    refreshFeeAlerts(supabase),
  ]);
  return sumRefresh(attendance, academic, performance, fees);
}

// -----------------------------------------------------------------------------
// Phase 2: School Health Score
// -----------------------------------------------------------------------------
function academicStatusScore(status: DeliveryStatus): number | null {
  switch (status) {
    case "ON_TRACK":
      return 100;
    case "SLIGHTLY_BEHIND":
      return 80;
    case "WARNING":
      return 50;
    case "CRITICAL":
      return 20;
    default:
      return null;
  }
}

function capPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export async function getSchoolHealthScore(supabase: SupabaseClient, academicYearId?: string) {
  const [attendance, academic, performance, fees, settingsRows] = await Promise.all([
    getAttendanceIntelligence(supabase, { academicYearId }),
    getAcademicIntelligence(supabase, { academicYearId }),
    getPerformanceIntelligence(supabase, { academicYearId }),
    getFeeIntelligence(supabase, { academicYearId }),
    repo.listSettings(supabase),
  ]);
  const settings = numericSettings(settingsRows);

  // Every component below reports BOTH a score and a coveragePercentage —
  // how much of its expected population actually has evidence. 5 of 200
  // students evaluated is real data, but computeHealthScore scales its
  // effective weight down accordingly rather than trusting it at full
  // weight (see rules.ts).
  // Coverage is OPPORTUNITY-based, not "has at least one record": 200
  // students × 20 working days = 4000 expected opportunities. 200 total
  // rows is 5% coverage, never the ~100% a per-student binary check would
  // report. Respects weekly off-days/calendar overrides via
  // attendance.workingDays, which buildWorkingDays already computed.
  const activeStudentCount = attendance.studentInsights.length;
  const studentExpectedOpportunities = activeStudentCount * attendance.workingDays.length;
  const studentRecorded = attendance.studentInsights.reduce((sum, row) => sum + row.recordedWorkingDays, 0);
  const studentPresent = attendance.studentInsights.reduce((sum, row) => sum + row.presentDays, 0);
  const studentAttendanceScore = studentRecorded > 0 ? Math.round((studentPresent / studentRecorded) * 10_000) / 100 : null;
  const studentAttendanceCoverage = computeAttendanceOpportunityCoverage(studentExpectedOpportunities, studentRecorded);

  // Staff expected opportunities exclude approved-leave days per staff
  // member (expectedWorkingDays), so leave never reduces the score or
  // reads as a missing/absence gap.
  const staffExpectedOpportunities = attendance.staffInsights.reduce((sum, row) => sum + row.expectedWorkingDays, 0);
  const staffRecorded = attendance.staffInsights.reduce((sum, row) => sum + row.recordedWorkingDays, 0);
  const staffPresent = attendance.staffInsights.reduce((sum, row) => sum + row.presentDays, 0);
  const staffAttendanceScore = staffRecorded > 0 ? Math.round((staffPresent / staffRecorded) * 10_000) / 100 : null;
  const staffAttendanceCoverage = computeAttendanceOpportunityCoverage(staffExpectedOpportunities, staffRecorded);

  const evaluableAcademicRows = academic.rows.filter((row) => row.status !== "INSUFFICIENT_DATA");
  const academicScores = evaluableAcademicRows.map((row) => academicStatusScore(row.status)).filter((value): value is number => value !== null);
  const academicProgressScore =
    academicScores.length > 0 ? Math.round((academicScores.reduce((sum, value) => sum + value, 0) / academicScores.length) * 100) / 100 : null;
  const academicProgressCoverage =
    academic.rows.length > 0 ? capPercentage(Math.round((evaluableAcademicRows.length / academic.rows.length) * 10_000) / 100) : 0;

  const evaluatedStudents = performance.insights.filter((row) => row.latestOverallPercentage !== null);
  const performanceScore =
    evaluatedStudents.length > 0
      ? Math.round((evaluatedStudents.reduce((sum, row) => sum + (row.latestOverallPercentage ?? 0), 0) / evaluatedStudents.length) * 100) / 100
      : null;
  const performanceCoverage =
    performance.insights.length > 0 ? capPercentage(Math.round((evaluatedStudents.length / performance.insights.length) * 10_000) / 100) : 0;

  const feeScore = fees.summary.dataCoverage === "NOT_RECORDED" ? null : fees.summary.collectionPercentage;
  const feeCoverage = activeStudentCount > 0 ? capPercentage(Math.round((fees.summary.studentsWithInvoice / activeStudentCount) * 10_000) / 100) : 0;

  const result = computeHealthScore([
    {
      key: "student_attendance",
      label: "Student Attendance",
      weight: settings.health_weight_student_attendance,
      score: studentAttendanceScore,
      coveragePercentage: studentAttendanceCoverage,
    },
    {
      key: "academic_progress",
      label: "Academic Progress",
      weight: settings.health_weight_academic_progress,
      score: academicProgressScore,
      coveragePercentage: academicProgressCoverage,
    },
    {
      key: "performance",
      label: "Student Performance",
      weight: settings.health_weight_performance,
      score: performanceScore,
      coveragePercentage: performanceCoverage,
    },
    {
      key: "staff_attendance",
      label: "Staff Attendance",
      weight: settings.health_weight_staff_attendance,
      score: staffAttendanceScore,
      coveragePercentage: staffAttendanceCoverage,
    },
    // Deliberately always unavailable: the only evidence available
    // (lesson_plans.status) is already the source for Academic Progress
    // above, and there is no actual timetable/session-completion evidence
    // in this schema. Scoring a second component from the identical signal
    // would double-count it under a misleading "Timetable/Delivery" label
    // that implies session-completion proof this system does not have.
    {
      key: "delivery",
      label: "Timetable/Delivery (session-completion evidence not tracked)",
      weight: settings.health_weight_delivery,
      score: null,
      coveragePercentage: 0,
    },
    { key: "fees", label: "Fee Collection", weight: settings.health_weight_fees, score: feeScore, coveragePercentage: feeCoverage },
  ]);

  return { ...result, label: healthLabel(result.score), academicYearId: attendance.academicYear?.id ?? null };
}

// -----------------------------------------------------------------------------
// Phase 2: Management Reviews
// -----------------------------------------------------------------------------
export async function getDailyReview(supabase: SupabaseClient) {
  const [overview, academic] = await Promise.all([getManagementOverview(supabase), getAcademicIntelligence(supabase)]);
  const subjectsNeedingAttention = academic.rows.filter((row) => row.status === "WARNING" || row.status === "CRITICAL");
  const evaluableAcademic = academic.rows.filter((row) => row.dataCoverage !== "NOT_RECORDED");
  return {
    overview,
    subjectsNeedingAttention,
    academicDeliveryCoverage: academic.rows.length > 0 ? Math.round((evaluableAcademic.length / academic.rows.length) * 10_000) / 100 : null,
  };
}

export async function getWeeklyReview(supabase: SupabaseClient) {
  const today = todayInSchoolTimezone();
  const weekStart = addDays(today, -6);
  const [attendance, academic, fees, alertSummary, newAlerts] = await Promise.all([
    getAttendanceIntelligence(supabase, { start: weekStart, end: today }),
    getAcademicIntelligence(supabase, { end: today }),
    getFeeIntelligence(supabase),
    repo.getAlertSummary(supabase, weekStart, today),
    repo.countAlertsFirstDetected(supabase, weekStart, today),
  ]);
  return {
    periodStart: weekStart,
    periodEnd: today,
    attendance,
    academic,
    fees,
    subjectsBehind: academic.rows.filter((row) => row.status === "WARNING" || row.status === "CRITICAL"),
    newAlerts,
    resolvedAlerts: alertSummary.resolvedThisPeriod,
  };
}

export async function getMonthlyReview(supabase: SupabaseClient) {
  const today = todayInSchoolTimezone();
  const monthStart = startOfMonth(today);
  const [attendance, performance, fees, alertSummary, activeAlertCountByStudent] = await Promise.all([
    getAttendanceIntelligence(supabase, { start: monthStart, end: today }),
    getPerformanceIntelligence(supabase),
    getFeeIntelligence(supabase),
    repo.getAlertSummary(supabase, monthStart, today),
    // Grouped SQL count, not a raw row fetch — repository.listAlerts caps
    // pageSize at 100 and would silently undercount past that; this stays
    // correct at any alert volume.
    repo.countActiveAlertsByStudent(supabase),
  ]);
  const students = performance.insights;
  const topPerformers = [...students]
    .filter((row) => row.classRank !== null)
    .sort((a, b) => (a.classRank ?? 0) - (b.classRank ?? 0))
    .slice(0, 10);
  const performanceByStudent = new Map(performance.insights.map((row) => [row.studentId, row]));
  const studentReview = attendance.studentInsights.map((row) => {
    const performanceRow = performanceByStudent.get(row.studentId) ?? null;
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      className: row.className,
      sectionName: row.sectionName,
      attendancePercentage: row.attendancePercentage,
      attendanceTrend: row.trend,
      currentPerformance: performanceRow?.latestOverallPercentage ?? null,
      currentComparablePerformance: performanceRow?.currentComparablePercentage ?? null,
      previousPerformance: performanceRow?.previousComparablePercentage ?? null,
      performanceDifference: performanceRow?.differencePoints ?? null,
      performanceTrend: performanceRow?.trend ?? "INSUFFICIENT_DATA",
      subjectsRequiringAttention: performanceRow?.subjectsRequiringAttention.length ?? 0,
      classRank: performanceRow?.classRank ?? null,
      activeAlerts: activeAlertCountByStudent.get(row.studentId) ?? 0,
    };
  });
  return {
    periodStart: monthStart,
    periodEnd: today,
    attendance,
    performance,
    fees,
    improvingStudents: students.filter((row) => row.trend === "IMPROVING" || row.trend === "STRONGLY_IMPROVING"),
    decliningStudents: students.filter((row) => row.trend === "DECLINING" || row.trend === "STRONGLY_DECLINING"),
    requiresAttention: students.filter((row) => row.requiresAttention),
    topPerformers,
    classPerformance: performance.classSummary,
    alertSummary,
    studentReview,
    healthScoreTrendMessage: "Health Score trend requires historical daily snapshots, which are not yet collected. Insufficient Data.",
  };
}
