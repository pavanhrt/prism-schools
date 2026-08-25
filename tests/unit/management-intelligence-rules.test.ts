import { describe, expect, it } from "vitest";
import {
  academicLagStatus,
  alertRefreshDecision,
  attendanceTrend,
  buildWorkingDays,
  calculateAttendance,
  computeAttendanceOpportunityCoverage,
  computeCoverage,
  computeDailyCoverage,
  computeHealthScore,
  consecutiveAbsenceDays,
  coverageStatus,
  denseRankByScore,
  expectedWorkingDaysExcludingLeave,
  feeCollectionRateBelowThreshold,
  feeCollectionRateRecovered,
  feeOverdueSeverity,
  healthLabel,
  isAlertTransitionAllowed,
  isDateCoveredByApprovedLeave,
  latestRecordedAttendanceEvaluation,
  lowAttendanceSeverity,
  newestWorkingDayEvaluation,
  performanceTrend,
  shouldAutoResolveAlert,
  studentAbsenceSeverity,
  workingDayLag,
} from "@/features/management-intelligence/rules";

describe("management intelligence absence correctness", () => {
  const workingDays = ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-24", "2026-08-25"];
  const absentRecords = (count: number) => workingDays.slice(-count).map((attendance_date) => ({ attendance_date, status: "absent" }));

  it("does not alert after two explicit absences", () => {
    expect(studentAbsenceSeverity(consecutiveAbsenceDays(absentRecords(2), workingDays), 3, 5)).toBeNull();
  });

  it("creates a warning after three explicit absences", () => {
    expect(studentAbsenceSeverity(consecutiveAbsenceDays(absentRecords(3), workingDays), 3, 5)).toBe("WARNING");
  });

  it("creates a critical alert after five explicit absences", () => {
    expect(studentAbsenceSeverity(consecutiveAbsenceDays(absentRecords(5), workingDays), 3, 5)).toBe("CRITICAL");
  });

  it("keeps a five-day critical streak when the next working day is missing", () => {
    const days = [...workingDays, "2026-08-26"];
    expect(consecutiveAbsenceDays(absentRecords(5), days)).toBe(5);
    expect(studentAbsenceSeverity(consecutiveAbsenceDays(absentRecords(5), days), 3, 5)).toBe("CRITICAL");
    expect(newestWorkingDayEvaluation(absentRecords(5), days)).toBe("NOT_EVALUATED");
    expect(latestRecordedAttendanceEvaluation(absentRecords(5), days)).toBe("ABSENT");
  });

  it("resolves a five-day streak only after a later present record", () => {
    const days = [...workingDays, "2026-08-26"];
    const records = [...absentRecords(5), { attendance_date: "2026-08-26", status: "present" }];
    expect(consecutiveAbsenceDays(records, days)).toBe(0);
    expect(newestWorkingDayEvaluation(records, days)).toBe("NON_ABSENT");
    expect(latestRecordedAttendanceEvaluation(records, days)).toBe("NON_ABSENT");
  });

  it("keeps the streak across Sunday", () => {
    const days = buildWorkingDays("2026-08-20", "2026-08-24", [0], []);
    const records = days.map((attendance_date) => ({ attendance_date, status: "absent" }));
    expect(days).toEqual(["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-24"]);
    expect(consecutiveAbsenceDays(records, days)).toBe(4);
  });

  it("keeps the streak across a configured holiday", () => {
    const days = buildWorkingDays("2026-08-20", "2026-08-25", [0], [{ calendar_date: "2026-08-21", is_working_day: false }]);
    const records = days.map((attendance_date) => ({ attendance_date, status: "absent" }));
    expect(days).not.toContain("2026-08-21");
    expect(consecutiveAbsenceDays(records, days)).toBe(days.length);
  });

  it("resets after any explicit non-absence record", () => {
    const records = workingDays.map((attendance_date, index) => ({ attendance_date, status: index === workingDays.length - 1 ? "late" : "absent" }));
    expect(consecutiveAbsenceDays(records, workingDays)).toBe(0);
    expect(latestRecordedAttendanceEvaluation(records, workingDays)).toBe("NON_ABSENT");
  });

  it("does not infer an absence when there are no evaluated working days", () => {
    expect(consecutiveAbsenceDays([], workingDays)).toBe(0);
    expect(newestWorkingDayEvaluation([], workingDays)).toBe("NOT_EVALUATED");
    expect(latestRecordedAttendanceEvaluation([], workingDays)).toBe("NOT_EVALUATED");
  });
});

describe("management intelligence attendance calculations", () => {
  const days = ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-24"];

  it("weights present, late, half-day, and absent as 1, 1, 0.5, and 0", () => {
    expect(calculateAttendance([
      { attendance_date: days[0], status: "present" },
      { attendance_date: days[1], status: "late" },
      { attendance_date: days[2], status: "half_day" },
      { attendance_date: days[3], status: "absent" },
    ], days)).toEqual({ recordedDays: 4, presentEquivalent: 2.5, percentage: 62.5 });
  });

  it("uses Insufficient Data rather than zero percent when nothing is recorded", () => {
    expect(calculateAttendance([], days)).toEqual({ recordedDays: 0, presentEquivalent: 0, percentage: null });
  });

  it("honors a date override above the recurring weekly rule", () => {
    expect(buildWorkingDays("2026-08-23", "2026-08-23", [0], [{ calendar_date: "2026-08-23", is_working_day: true }])).toEqual(["2026-08-23"]);
  });

  it("keeps exact threshold boundary behavior", () => {
    expect(lowAttendanceSeverity(75, 75, 65)).toBeNull();
    expect(lowAttendanceSeverity(65, 75, 65)).toBe("WARNING");
    expect(lowAttendanceSeverity(64.99, 75, 65)).toBe("CRITICAL");
    expect(attendanceTrend(81, 91, 10).status).toBe("DECLINING");
  });
});

describe("management alert lifecycle rules", () => {
  it("creates, deduplicates updates, and reopens deterministic fingerprints", () => {
    expect(alertRefreshDecision(null)).toBe("CREATE");
    expect(alertRefreshDecision("OPEN")).toBe("UPDATE");
    expect(alertRefreshDecision("ACKNOWLEDGED")).toBe("UPDATE");
    expect(alertRefreshDecision("RESOLVED")).toBe("REOPEN");
    expect(alertRefreshDecision("DISMISSED")).toBe("REOPEN");
  });

  it("allows acknowledge, resolve, and dismiss only from active lifecycle states", () => {
    expect(isAlertTransitionAllowed("OPEN", "ACKNOWLEDGED")).toBe(true);
    expect(isAlertTransitionAllowed("OPEN", "RESOLVED")).toBe(true);
    expect(isAlertTransitionAllowed("OPEN", "DISMISSED")).toBe(true);
    expect(isAlertTransitionAllowed("ACKNOWLEDGED", "RESOLVED")).toBe(true);
    expect(isAlertTransitionAllowed("ACKNOWLEDGED", "DISMISSED")).toBe(true);
    expect(isAlertTransitionAllowed("ACKNOWLEDGED", "ACKNOWLEDGED")).toBe(false);
    expect(isAlertTransitionAllowed("RESOLVED", "ACKNOWLEDGED")).toBe(false);
    expect(isAlertTransitionAllowed("DISMISSED", "RESOLVED")).toBe(false);
  });

  it("auto-resolves only an active condition that has disappeared", () => {
    expect(shouldAutoResolveAlert(true, false)).toBe(true);
    expect(shouldAutoResolveAlert(true, true)).toBe(false);
    expect(shouldAutoResolveAlert(false, false)).toBe(false);
  });
});

describe("management intelligence phase 2: attendance coverage", () => {
  it("is NOT_RECORDED at zero rows, never read as 0%", () => {
    expect(computeCoverage(200, 0)).toEqual({ activeCount: 200, recordedCount: 0, missingCount: 200, coveragePercentage: 0, status: "NOT_RECORDED" });
  });
  it("is COMPLETE at 95% and above", () => {
    expect(coverageStatus(190, 95)).toBe("COMPLETE");
    expect(computeCoverage(200, 190).status).toBe("COMPLETE");
  });
  it("is PARTIAL between 80% and 94.99%", () => {
    expect(coverageStatus(160, 80)).toBe("PARTIAL");
    expect(computeCoverage(200, 160)).toEqual({ activeCount: 200, recordedCount: 160, missingCount: 40, coveragePercentage: 80, status: "PARTIAL" });
  });
  it("is INCOMPLETE below 80%", () => expect(coverageStatus(100, 50)).toBe("INCOMPLETE"));
  it("has no denominator when there are no active students", () => {
    expect(computeCoverage(0, 0)).toEqual({ activeCount: 0, recordedCount: 0, missingCount: 0, coveragePercentage: null, status: "NOT_RECORDED" });
  });
});

describe("management intelligence phase 2b: fee collection-rate warning", () => {
  it("warns once collection percentage is below the threshold with real invoice data", () => {
    expect(feeCollectionRateBelowThreshold("COMPLETE", 45, 60)).toBe(true);
  });
  it("does not warn at or above the threshold", () => {
    expect(feeCollectionRateBelowThreshold("COMPLETE", 60, 60)).toBe(false);
    expect(feeCollectionRateBelowThreshold("COMPLETE", 75, 60)).toBe(false);
  });
  it("never warns (or recovers) on missing fee data — NOT_RECORDED is not a 0% crisis", () => {
    expect(feeCollectionRateBelowThreshold("NOT_RECORDED", null, 60)).toBe(false);
    expect(feeCollectionRateRecovered("NOT_RECORDED", null, 60)).toBe(false);
  });
  it("recovers only once collection percentage is back at or above the threshold with real data", () => {
    expect(feeCollectionRateRecovered("COMPLETE", 59.9, 60)).toBe(false);
    expect(feeCollectionRateRecovered("COMPLETE", 60, 60)).toBe(true);
    expect(feeCollectionRateRecovered("COMPLETE", 75, 60)).toBe(true);
  });
});

describe("phase 2c: opportunity-based attendance health coverage", () => {
  it("is 5% for 200 students × 20 working days with only 200 total records — not 100%", () => {
    // A per-student "has at least one record" check would wrongly read this as 100%.
    expect(computeAttendanceOpportunityCoverage(200 * 20, 200)).toBe(5);
  });
  it("is 100% when every opportunity is recorded", () => {
    expect(computeAttendanceOpportunityCoverage(4000, 4000)).toBe(100);
  });
  it("has no denominator when there are no expected opportunities", () => {
    expect(computeAttendanceOpportunityCoverage(0, 0)).toBe(0);
  });
  it("caps at 100% defensively even if recorded somehow exceeds expected", () => {
    expect(computeAttendanceOpportunityCoverage(100, 150)).toBe(100);
  });
});

describe("phase 2c: staff expected-opportunity denominator excludes approved leave", () => {
  const twentyWorkingDays = Array.from({ length: 20 }, (_, i) => `2026-08-${String(i + 1).padStart(2, "0")}`);

  it("excludes exactly the leave-covered days from the expected denominator", () => {
    const leave = [{ staff_id: "staff-1", start_date: "2026-08-01", end_date: "2026-08-05" }]; // 5 days
    expect(expectedWorkingDaysExcludingLeave(twentyWorkingDays, "staff-1", leave)).toBe(15);
  });
  it("does not reduce the denominator for a staff member with no leave", () => {
    const leave = [{ staff_id: "staff-1", start_date: "2026-08-01", end_date: "2026-08-05" }];
    expect(expectedWorkingDaysExcludingLeave(twentyWorkingDays, "staff-2", leave)).toBe(20);
  });
  it("computes the correct total expected opportunities for 10 staff with 2 on 5-day leave each", () => {
    const leave = [
      { staff_id: "staff-1", start_date: "2026-08-01", end_date: "2026-08-05" },
      { staff_id: "staff-2", start_date: "2026-08-01", end_date: "2026-08-05" },
    ];
    const staffIds = Array.from({ length: 10 }, (_, i) => `staff-${i + 1}`);
    const totalExpected = staffIds.reduce((sum, id) => sum + expectedWorkingDaysExcludingLeave(twentyWorkingDays, id, leave), 0);
    expect(totalExpected).toBe(190); // (10 × 20) − (2 × 5)
  });
  it("confirms the leave-day check itself is inclusive of both range endpoints", () => {
    const leave = [{ staff_id: "staff-1", start_date: "2026-08-01", end_date: "2026-08-05" }];
    expect(isDateCoveredByApprovedLeave("staff-1", "2026-08-01", leave)).toBe(true);
    expect(isDateCoveredByApprovedLeave("staff-1", "2026-08-05", leave)).toBe(true);
    expect(isDateCoveredByApprovedLeave("staff-1", "2026-08-06", leave)).toBe(false);
  });
});

describe("management intelligence phase 2b: non-working-day attendance coverage", () => {
  it("does not raise a missing-attendance alarm on a non-working day", () => {
    expect(computeDailyCoverage(200, 0, false)).toEqual({ activeCount: 200, recordedCount: 0, missingCount: 0, coveragePercentage: null, status: "NOT_EXPECTED" });
  });
  it("still reports NOT_EXPECTED even if some rows exist on a non-working day (e.g. a makeup session)", () => {
    expect(computeDailyCoverage(200, 5, false).status).toBe("NOT_EXPECTED");
  });
  it("evaluates coverage normally on a working day", () => {
    expect(computeDailyCoverage(200, 160, true)).toEqual({ activeCount: 200, recordedCount: 160, missingCount: 40, coveragePercentage: 80, status: "PARTIAL" });
  });
});

describe("management intelligence phase 2: academic lag", () => {
  const days = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28"];
  it("computes zero lag for a plan not yet due", () => expect(workingDayLag("2026-08-28", "2026-08-28", days)).toBe(0));
  it("counts only working days strictly after the plan date", () => expect(workingDayLag("2026-08-19", "2026-08-24", days)).toBe(3));
  it("is ON_TRACK at 0 days", () => expect(academicLagStatus(0, 1, 4, 8)).toBe("ON_TRACK"));
  it("is SLIGHTLY_BEHIND at 1 and 3 days", () => {
    expect(academicLagStatus(1, 1, 4, 8)).toBe("SLIGHTLY_BEHIND");
    expect(academicLagStatus(3, 1, 4, 8)).toBe("SLIGHTLY_BEHIND");
  });
  it("is WARNING at 4 and 7 days", () => {
    expect(academicLagStatus(4, 1, 4, 8)).toBe("WARNING");
    expect(academicLagStatus(7, 1, 4, 8)).toBe("WARNING");
  });
  it("is CRITICAL at 8 days and beyond", () => expect(academicLagStatus(8, 1, 4, 8)).toBe("CRITICAL"));
  it("is INSUFFICIENT_DATA when there is no overdue plan to evaluate", () => expect(academicLagStatus(null, 1, 4, 8)).toBe("INSUFFICIENT_DATA"));
});

describe("management intelligence phase 2: performance trend", () => {
  it("is STRONGLY_IMPROVING at +10 or more", () => expect(performanceTrend(85, 75, 3, 10).status).toBe("STRONGLY_IMPROVING"));
  it("is IMPROVING at +3", () => expect(performanceTrend(78, 75, 3, 10).status).toBe("IMPROVING"));
  it("is STABLE at 0", () => expect(performanceTrend(75, 75, 3, 10)).toEqual({ differencePoints: 0, status: "STABLE" }));
  it("is DECLINING at -3", () => expect(performanceTrend(72, 75, 3, 10).status).toBe("DECLINING"));
  it("is STRONGLY_DECLINING at -10 or beyond", () => expect(performanceTrend(61, 75, 3, 10).status).toBe("STRONGLY_DECLINING"));
  it("is INSUFFICIENT_DATA with no comparable previous result", () => expect(performanceTrend(85, null, 3, 10)).toEqual({ differencePoints: null, status: "INSUFFICIENT_DATA" }));
});

describe("management intelligence phase 2: ranking and fee overdue detection", () => {
  it("dense-ranks tied scores without gaps", () => expect(denseRankByScore([95, 95, 92, 88])).toEqual([1, 1, 2, 3]));
  it("dense-ranks a fully-tied set as rank 1 throughout", () => expect(denseRankByScore([70, 70, 70])).toEqual([1, 1, 1]));
  it("preserves input order while ranking", () => expect(denseRankByScore([60, 90, 90, 75])).toEqual([3, 1, 1, 2]));
  it("has no severity for a not-yet-due or absent balance", () => {
    expect(feeOverdueSeverity(0, 7, 30)).toBeNull();
    expect(feeOverdueSeverity(null, 7, 30)).toBeNull();
  });
  it("warns and escalates at the configured overdue-day thresholds", () => {
    expect(feeOverdueSeverity(7, 7, 30)).toBe("WARNING");
    expect(feeOverdueSeverity(29, 7, 30)).toBe("WARNING");
    expect(feeOverdueSeverity(30, 7, 30)).toBe("CRITICAL");
  });
});

describe("management intelligence phase 2b: school health score (coverage-aware)", () => {
  it("scores full coverage as a plain weighted average", () => {
    const result = computeHealthScore([
      { key: "attendance", label: "Student Attendance", weight: 25, score: 90, coveragePercentage: 100 },
      { key: "academics", label: "Academic Progress", weight: 25, score: 80, coveragePercentage: 100 },
      { key: "performance", label: "Student Performance", weight: 25, score: 70, coveragePercentage: 100 },
      { key: "staff", label: "Staff Attendance", weight: 10, score: 95, coveragePercentage: 100 },
      { key: "delivery", label: "Timetable/Delivery", weight: 10, score: 60, coveragePercentage: 100 },
      { key: "fees", label: "Fee Collection", weight: 5, score: 100, coveragePercentage: 100 },
    ]);
    expect(result.score).toBeCloseTo(80.5, 2);
    expect(result.coveragePercentage).toBe(100);
    expect(result.unavailable).toEqual([]);
  });
  it("re-normalizes weights and reports coverage when a component is entirely missing (0% coverage), never scoring it as zero", () => {
    const result = computeHealthScore([
      { key: "attendance", label: "Student Attendance", weight: 25, score: 90, coveragePercentage: 100 },
      { key: "academics", label: "Academic Progress", weight: 25, score: 80, coveragePercentage: 100 },
      { key: "performance", label: "Student Performance", weight: 25, score: 70, coveragePercentage: 100 },
      { key: "staff", label: "Staff Attendance", weight: 10, score: 95, coveragePercentage: 100 },
      { key: "delivery", label: "Timetable/Delivery", weight: 10, score: null, coveragePercentage: 0 },
      { key: "fees", label: "Fee Collection", weight: 5, score: 100, coveragePercentage: 100 },
    ]);
    expect(result.unavailable).toEqual(["Timetable/Delivery"]);
    expect(result.coveragePercentage).toBe(90);
    expect(result.score).toBeCloseTo((90 * 25 + 80 * 25 + 70 * 25 + 95 * 10 + 100 * 5) / 90, 2);
  });
  it("scales a partially-covered component's effective weight instead of treating it as fully available", () => {
    // 5 of 200 students evaluated: 2.5% coverage, not full weight.
    const result = computeHealthScore([
      { key: "attendance", label: "Student Attendance", weight: 50, score: 90, coveragePercentage: 100 },
      { key: "performance", label: "Student Performance", weight: 50, score: 40, coveragePercentage: 2.5 },
    ]);
    const expectedEffective = { attendance: 50, performance: 50 * 0.025 };
    const sumEffective = expectedEffective.attendance + expectedEffective.performance;
    expect(result.score).toBeCloseTo((90 * expectedEffective.attendance + 40 * expectedEffective.performance) / sumEffective, 2);
    expect(result.coveragePercentage).toBeCloseTo((sumEffective / 100) * 100, 2);
    expect(result.unavailable).toEqual([]);
    const performanceComponent = result.components.find((c) => c.key === "performance")!;
    expect(performanceComponent.effectiveWeight).toBeCloseTo(1.25, 2);
  });
  it("has no score when every component has 0% coverage", () => {
    const result = computeHealthScore([{ key: "attendance", label: "Student Attendance", weight: 25, score: null, coveragePercentage: 0 }]);
    expect(result.score).toBeNull();
    expect(result.coveragePercentage).toBe(0);
  });
  it("labels score bands", () => {
    expect(healthLabel(95)).toBe("Excellent");
    expect(healthLabel(90)).toBe("Excellent");
    expect(healthLabel(89.9)).toBe("Good");
    expect(healthLabel(75)).toBe("Good");
    expect(healthLabel(74.9)).toBe("Attention Needed");
    expect(healthLabel(60)).toBe("Attention Needed");
    expect(healthLabel(59.9)).toBe("Critical Attention");
    expect(healthLabel(null)).toBe("Not Available");
  });
});
