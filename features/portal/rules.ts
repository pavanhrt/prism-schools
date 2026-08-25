/**
 * Pure, deterministic parent-portal rules — no AI, no DB access. Every
 * status/label here is computed from real recorded data using configured
 * (never hardcoded) thresholds; "no data" is always distinct from "zero".
 */

export interface AttendanceBreakdown {
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  recordedDays: number;
  /** Weighted: present/late = 1, half_day = 0.5 — matches the school-wide
   * attendance-percentage convention used elsewhere in the app. */
  percentage: number | null;
}

/** student_attendance only has present/absent/late/half_day — there is no
 * "leave" status for students (that's a staff-only concept) and no
 * attendance row at all is written for a non-working day (holiday). A
 * holiday is therefore never a row here, by design — not a bucket to fill. */
export function computeAttendanceBreakdown(records: { status: string }[]): AttendanceBreakdown {
  const presentDays = records.filter((r) => r.status === "present").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const halfDays = records.filter((r) => r.status === "half_day").length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  const recordedDays = records.length;
  const presentEquivalent = presentDays + lateDays + halfDays * 0.5;
  const percentage = recordedDays > 0 ? Math.round((presentEquivalent / recordedDays) * 10_000) / 100 : null;
  return { presentDays, absentDays, halfDays, lateDays, recordedDays, percentage };
}

/** Consecutive absences counted from the most recently RECORDED day
 * backward. student_attendance rows are only ever written for days
 * attendance was actually taken (working days), so the recorded rows
 * themselves already exclude weekends/holidays — no separate calendar
 * lookup is needed to get this right. */
export function consecutivePortalAbsences(recordsDescByDate: { status: string }[]): number {
  let streak = 0;
  for (const record of recordsDescByDate) {
    if (record.status !== "absent") break;
    streak += 1;
  }
  return streak;
}

export type AttendanceAlertLevel = "ABSENT_TODAY" | "CONSECUTIVE_WARNING" | "CONSECUTIVE_CRITICAL" | "BELOW_THRESHOLD" | null;

export interface AttendanceAlert {
  level: AttendanceAlertLevel;
  label: string;
}

/** Rule-based, not AI: picks the single most urgent applicable condition. */
export function computeAttendanceAlert(params: {
  isAbsentToday: boolean;
  consecutiveAbsences: number;
  percentage: number | null;
  warningConsecutiveDays: number;
  criticalConsecutiveDays: number;
  warningPercentage: number;
  criticalPercentage: number;
}): AttendanceAlert {
  const { isAbsentToday, consecutiveAbsences, percentage, warningConsecutiveDays, criticalConsecutiveDays, warningPercentage, criticalPercentage } = params;
  if (consecutiveAbsences >= criticalConsecutiveDays) {
    return { level: "CONSECUTIVE_CRITICAL", label: `Absent ${consecutiveAbsences} days in a row` };
  }
  if (consecutiveAbsences >= warningConsecutiveDays) {
    return { level: "CONSECUTIVE_WARNING", label: `Absent ${consecutiveAbsences} days in a row` };
  }
  if (percentage !== null && percentage < criticalPercentage) {
    return { level: "BELOW_THRESHOLD", label: `Attendance ${percentage}% — Needs Attention` };
  }
  if (percentage !== null && percentage < warningPercentage) {
    return { level: "BELOW_THRESHOLD", label: `Attendance ${percentage}% — Needs Attention` };
  }
  if (isAbsentToday) return { level: "ABSENT_TODAY", label: "Absent today" };
  return { level: null, label: "" };
}

export type ProgressLabel = "IMPROVED" | "STABLE" | "DECLINED" | "INSUFFICIENT_DATA";

/** Deterministic subject-progress comparison — a percentage-point delta
 * against a configured threshold, nothing inferred or generated. */
export function compareSubjectProgress(previousPct: number | null, latestPct: number | null, stableBandPoints: number): { differencePoints: number | null; label: ProgressLabel } {
  if (previousPct === null || latestPct === null) return { differencePoints: null, label: "INSUFFICIENT_DATA" };
  const differencePoints = Math.round((latestPct - previousPct) * 100) / 100;
  if (differencePoints > stableBandPoints) return { differencePoints, label: "IMPROVED" };
  if (differencePoints < -stableBandPoints) return { differencePoints, label: "DECLINED" };
  return { differencePoints, label: "STABLE" };
}
