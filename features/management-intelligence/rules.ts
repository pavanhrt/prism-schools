import type {
  AlertSeverity,
  AttendanceMetric,
  CalendarOverride,
  CoverageMetric,
  CoverageStatus,
  DeliveryStatus,
  HealthComponentInput,
  HealthComponentResult,
  HealthScoreResult,
  PerformanceTrendResult,
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

/** Phase 2C: how many of a staff member's applicable working days are
 * actually expected to be recorded — i.e. NOT covered by approved leave.
 * Leave days must reduce the coverage denominator, never count as a gap. */
export function expectedWorkingDaysExcludingLeave(
  workingDays: string[],
  staffId: string,
  leave: { staff_id: string; start_date: string; end_date: string }[],
): number {
  return workingDays.filter((date) => !isDateCoveredByApprovedLeave(staffId, date, leave)).length;
}

/**
 * Phase 2C: attendance data coverage as recorded OPPORTUNITIES, not "has at
 * least one record". 200 students each with exactly one row out of 20
 * working days is 5% coverage (200/4000), never 100% — a per-student binary
 * check would badly overstate completeness at any real working-day count.
 */
export function computeAttendanceOpportunityCoverage(expectedOpportunities: number, recordedOpportunities: number): number {
  if (expectedOpportunities <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((recordedOpportunities / expectedOpportunities) * 10_000) / 100));
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

// -----------------------------------------------------------------------------
// Phase 2: data-quality coverage. Zero recorded rows is NOT_RECORDED, never a
// 0% coverage reading, so an empty dashboard never gets misread as "complete".
// -----------------------------------------------------------------------------
export function coverageStatus(recordedCount: number, percentage: number | null): CoverageStatus {
  if (recordedCount === 0 || percentage === null) return "NOT_RECORDED";
  if (percentage >= 95) return "COMPLETE";
  if (percentage >= 80) return "PARTIAL";
  return "INCOMPLETE";
}

export function computeCoverage(activeCount: number, recordedCount: number): CoverageMetric {
  const missingCount = Math.max(activeCount - recordedCount, 0);
  const coveragePercentage = activeCount > 0 ? Math.round((recordedCount / activeCount) * 10_000) / 100 : null;
  return {
    activeCount,
    recordedCount,
    missingCount,
    coveragePercentage,
    status: coverageStatus(recordedCount, coveragePercentage),
  };
}

/**
 * Daily attendance coverage, aware of the school calendar. On a non-working
 * day (weekly off-day or a holiday override), zero recorded attendance is
 * expected — showing "N students missing attendance" on a Sunday is a false
 * data-quality alarm, not a real gap. missingCount is forced to 0 rather
 * than left to be misread as a backlog that needs entering.
 */
export function computeDailyCoverage(activeCount: number, recordedCount: number, isWorkingDay: boolean): CoverageMetric {
  if (!isWorkingDay) {
    return { activeCount, recordedCount, missingCount: 0, coveragePercentage: null, status: "NOT_EXPECTED" };
  }
  return computeCoverage(activeCount, recordedCount);
}

// -----------------------------------------------------------------------------
// Phase 2: academic delivery lag. Lag is only ever computed from an actual
// overdue lesson plan (planned_date in the past, not completed); with no such
// plan there is nothing objective to lag behind, so the result is
// INSUFFICIENT_DATA rather than a fabricated zero.
// -----------------------------------------------------------------------------
export function workingDayLag(planDate: string, asOfDate: string, workingDays: string[]): number {
  if (planDate >= asOfDate) return 0;
  return workingDays.filter((date) => date > planDate && date <= asOfDate).length;
}

export function academicLagStatus(
  lagDays: number | null,
  slightlyBehindMinDays: number,
  warningMinDays: number,
  criticalMinDays: number,
): DeliveryStatus {
  if (lagDays === null) return "INSUFFICIENT_DATA";
  if (lagDays >= criticalMinDays) return "CRITICAL";
  if (lagDays >= warningMinDays) return "WARNING";
  if (lagDays >= slightlyBehindMinDays) return "SLIGHTLY_BEHIND";
  return "ON_TRACK";
}

// -----------------------------------------------------------------------------
// Phase 2: performance trend. Symmetric point thresholds around a stable band;
// no prior comparable result is INSUFFICIENT_DATA, never treated as decline.
// -----------------------------------------------------------------------------
export function performanceTrend(
  current: number | null,
  previous: number | null,
  changePoints: number,
  strongChangePoints: number,
): PerformanceTrendResult {
  if (current === null || previous === null) return { differencePoints: null, status: "INSUFFICIENT_DATA" };
  const differencePoints = Math.round((current - previous) * 100) / 100;
  if (differencePoints >= strongChangePoints) return { differencePoints, status: "STRONGLY_IMPROVING" };
  if (differencePoints >= changePoints) return { differencePoints, status: "IMPROVING" };
  if (differencePoints <= -strongChangePoints) return { differencePoints, status: "STRONGLY_DECLINING" };
  if (differencePoints <= -changePoints) return { differencePoints, status: "DECLINING" };
  return { differencePoints, status: "STABLE" };
}

// -----------------------------------------------------------------------------
// Phase 2: dense ranking (ties share a rank, no gap after them) for class and
// subject leaderboards, applied to an array of scores in roster order.
// -----------------------------------------------------------------------------
export function denseRankByScore(scores: number[]): number[] {
  const sorted = [...new Set(scores)].sort((a, b) => b - a);
  const rankByScore = new Map(sorted.map((score, index) => [score, index + 1]));
  return scores.map((score) => rankByScore.get(score)!);
}

// -----------------------------------------------------------------------------
// Phase 2B: fee collection-rate warning. The same gate governs both raising
// and clearing the alert, so "missing fee data" can never accidentally
// satisfy either direction — it only ever leaves the alert exactly as it was.
// -----------------------------------------------------------------------------
export function feeCollectionRateBelowThreshold(
  dataCoverage: CoverageStatus,
  collectionPercentage: number | null,
  warningThresholdPct: number,
): boolean {
  if (dataCoverage === "NOT_RECORDED" || collectionPercentage === null) return false;
  return collectionPercentage < warningThresholdPct;
}

export function feeCollectionRateRecovered(
  dataCoverage: CoverageStatus,
  collectionPercentage: number | null,
  warningThresholdPct: number,
): boolean {
  if (dataCoverage === "NOT_RECORDED" || collectionPercentage === null) return false;
  return collectionPercentage >= warningThresholdPct;
}

// -----------------------------------------------------------------------------
// Phase 2: fee overdue severity, driven by configured day thresholds.
// -----------------------------------------------------------------------------
export function feeOverdueSeverity(
  overdueDays: number | null,
  warningDays: number,
  criticalDays: number,
): AlertSeverity | null {
  if (overdueDays === null || overdueDays <= 0) return null;
  if (overdueDays >= criticalDays) return "CRITICAL";
  if (overdueDays >= warningDays) return "WARNING";
  return null;
}

// -----------------------------------------------------------------------------
// Phase 2B: School Health Score, coverage-aware. A component isn't simply
// "available" or "unavailable" — 5 evaluated students out of 200 is real
// data, but it shouldn't carry the same weight as 200/200. Each component's
// configured weight is scaled by how much of its expected population it
// actually covers (effectiveWeight = weight * coveragePercentage / 100)
// before being folded into the weighted average. A component at 0%
// coverage contributes no score and no weight — never scored as zero.
// -----------------------------------------------------------------------------
export function computeHealthScore(components: HealthComponentInput[]): HealthScoreResult {
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  const withEffectiveWeight: HealthComponentResult[] = components.map((component) => ({
    ...component,
    effectiveWeight: Math.round(component.weight * (component.coveragePercentage / 100) * 10_000) / 10_000,
  }));
  const sumEffectiveWeight = withEffectiveWeight.reduce((sum, component) => sum + component.effectiveWeight, 0);
  const score =
    sumEffectiveWeight > 0
      ? Math.round(
          (withEffectiveWeight.reduce((sum, component) => sum + (component.score ?? 0) * component.effectiveWeight, 0) / sumEffectiveWeight) *
            100,
        ) / 100
      : null;
  const coveragePercentage = totalWeight > 0 ? Math.round((sumEffectiveWeight / totalWeight) * 10_000) / 100 : 0;
  const unavailable = components.filter((component) => component.coveragePercentage <= 0).map((component) => component.label);
  return { score, coveragePercentage, unavailable, components: withEffectiveWeight };
}

export type HealthLabel = "Excellent" | "Good" | "Attention Needed" | "Critical Attention" | "Not Available";

export function healthLabel(score: number | null): HealthLabel {
  if (score === null) return "Not Available";
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Attention Needed";
  return "Critical Attention";
}
