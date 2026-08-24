import { describe, expect, it } from "vitest";
import {
  alertRefreshDecision,
  attendanceTrend,
  buildWorkingDays,
  calculateAttendance,
  consecutiveAbsenceDays,
  isAlertTransitionAllowed,
  latestRecordedAttendanceEvaluation,
  lowAttendanceSeverity,
  newestWorkingDayEvaluation,
  shouldAutoResolveAlert,
  studentAbsenceSeverity,
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
