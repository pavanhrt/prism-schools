import type {
  AlertSeverity,
  AttendanceMetric,
  CalendarOverride,
  TrendStatus,
} from "./types";

const DAY_MS = 86_400_000;

function dateFromIso(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(value: string, days: number): string {
  return new Date(dateFromIso(value).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function enumerateDates(start: string, end: string): string[] {
  if (start > end) return [];
  const values: string[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) values.push(current);
  return values;
}

export function buildWorkingDays(
  start: string,
  end: string,
  weeklyOffDays: number[],
  overrides: Pick<CalendarOverride, "calendar_date" | "is_working_day">[],
): string[] {
  const overrideMap = new Map(overrides.map((item) => [item.calendar_date, item.is_working_day]));
  const weeklyOff = new Set(weeklyOffDays);
  return enumerateDates(start, end).filter((date) => {
    const override = overrideMap.get(date);
    if (override !== undefined) return override;
    return !weeklyOff.has(dateFromIso(date).getUTCDay());
  });
}

export function calculateAttendance(
  records: { attendance_date: string; status: string }[],
  workingDays: string[],
): AttendanceMetric {
  const allowed = new Set(workingDays);
  const relevant = records.filter((record) => allowed.has(record.attendance_date));
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

export function consecutiveAbsenceDays(
  records: { attendance_date: string; status: string }[],
  workingDays: string[],
): number {
  const statuses = new Map(records.map((record) => [record.attendance_date, record.status]));
  let streak = 0;
  let foundEvaluatedDay = false;
  for (let index = workingDays.length - 1; index >= 0; index -= 1) {
    const status = statuses.get(workingDays[index]);
    if (!foundEvaluatedDay && status === undefined) continue;
    foundEvaluatedDay = true;
    if (status !== "absent") break;
    streak += 1;
  }
  return streak;
}

export function newestWorkingDayEvaluation(
  records: { attendance_date: string; status: string }[],
  workingDays: string[],
): "ABSENT" | "NON_ABSENT" | "NOT_EVALUATED" {
  const newestWorkingDay = workingDays.at(-1);
  if (!newestWorkingDay) return "NOT_EVALUATED";
  const status = records.find((record) => record.attendance_date === newestWorkingDay)?.status;
  if (status === undefined) return "NOT_EVALUATED";
  return status === "absent" ? "ABSENT" : "NON_ABSENT";
}

export function latestRecordedAttendanceEvaluation(
  records: { attendance_date: string; status: string }[],
  workingDays: string[],
): "ABSENT" | "NON_ABSENT" | "NOT_EVALUATED" {
  const statuses = new Map(records.map((record) => [record.attendance_date, record.status]));
  for (let index = workingDays.length - 1; index >= 0; index -= 1) {
    const status = statuses.get(workingDays[index]);
    if (status === undefined) continue;
    return status === "absent" ? "ABSENT" : "NON_ABSENT";
  }
  return "NOT_EVALUATED";
}

export function studentAbsenceSeverity(
  streak: number,
  warningDays: number,
  criticalDays: number,
): AlertSeverity | null {
  if (streak >= criticalDays) return "CRITICAL";
  if (streak >= warningDays) return "WARNING";
  return null;
}

export function lowAttendanceSeverity(
  percentage: number | null,
  warningPercentage: number,
  criticalPercentage: number,
): AlertSeverity | null {
  if (percentage === null) return null;
  if (percentage < criticalPercentage) return "CRITICAL";
  if (percentage < warningPercentage) return "WARNING";
  return null;
}

export function attendanceTrend(
  currentPercentage: number | null,
  previousPercentage: number | null,
  declineThresholdPoints: number,
): { differencePoints: number | null; status: TrendStatus } {
  if (currentPercentage === null || previousPercentage === null) {
    return { differencePoints: null, status: "INSUFFICIENT_DATA" };
  }
  const differencePoints = Math.round((currentPercentage - previousPercentage) * 100) / 100;
  if (differencePoints <= -declineThresholdPoints) return { differencePoints, status: "DECLINING" };
  if (differencePoints > 0) return { differencePoints, status: "IMPROVING" };
  return { differencePoints, status: "STABLE" };
}

export function previousComparablePeriod(start: string, end: string) {
  const duration = Math.round((dateFromIso(end).getTime() - dateFromIso(start).getTime()) / DAY_MS) + 1;
  const previousEnd = addDays(start, -1);
  return { start: addDays(previousEnd, -(duration - 1)), end: previousEnd };
}

export function isDateCoveredByApprovedLeave(
  staffId: string,
  date: string,
  leave: { staff_id: string; start_date: string; end_date: string }[],
) {
  return leave.some((item) => item.staff_id === staffId && item.start_date <= date && item.end_date >= date);
}

export function alertRefreshDecision(priorStatus: string | null): "CREATE" | "UPDATE" | "REOPEN" {
  if (priorStatus === null) return "CREATE";
  if (priorStatus === "RESOLVED" || priorStatus === "DISMISSED") return "REOPEN";
  return "UPDATE";
}

export function shouldAutoResolveAlert(isActive: boolean, conditionStillPresent: boolean) {
  return isActive && !conditionStillPresent;
}

export function isAlertTransitionAllowed(
  currentStatus: string,
  nextStatus: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED",
): boolean {
  if (currentStatus === "OPEN") return true;
  if (currentStatus === "ACKNOWLEDGED") return nextStatus === "RESOLVED" || nextStatus === "DISMISSED";
  return false;
}
