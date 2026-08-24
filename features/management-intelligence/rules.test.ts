import { describe, expect, it } from "vitest";
import {
  alertRefreshDecision,
  attendanceTrend,
  buildWorkingDays,
  calculateAttendance,
  consecutiveAbsenceDays,
  isDateCoveredByApprovedLeave,
  lowAttendanceSeverity,
  shouldAutoResolveAlert,
  studentAbsenceSeverity,
} from "./rules";

describe("consecutive student absence", () => {
  const workingDays = ["2026-08-21", "2026-08-22", "2026-08-24", "2026-08-25", "2026-08-26"];
  const records = (count: number) => workingDays.slice(-count).map((attendance_date) => ({ attendance_date, status: "absent" }));

  it("does not alert at two days", () => expect(studentAbsenceSeverity(consecutiveAbsenceDays(records(2), workingDays), 3, 5)).toBeNull());
  it("warns at three days", () => expect(studentAbsenceSeverity(consecutiveAbsenceDays(records(3), workingDays), 3, 5)).toBe("WARNING"));
  it("is critical at five days", () => expect(studentAbsenceSeverity(consecutiveAbsenceDays(records(5), workingDays), 3, 5)).toBe("CRITICAL"));
  it("excludes Sunday between absent days", () => {
    const days = buildWorkingDays("2026-08-21", "2026-08-24", [0], []);
    expect(days).toEqual(["2026-08-21", "2026-08-22", "2026-08-24"]);
    expect(consecutiveAbsenceDays(days.map((attendance_date) => ({ attendance_date, status: "absent" })), days)).toBe(3);
  });
  it("excludes a configured holiday", () => {
    const days = buildWorkingDays("2026-08-24", "2026-08-27", [0], [{ calendar_date: "2026-08-25", is_working_day: false }]);
    expect(days).toEqual(["2026-08-24", "2026-08-26", "2026-08-27"]);
    expect(consecutiveAbsenceDays(days.map((attendance_date) => ({ attendance_date, status: "absent" })), days)).toBe(3);
  });
  it("resets after a present day", () => {
    const values = workingDays.map((attendance_date, index) => ({ attendance_date, status: index === 4 ? "present" : "absent" }));
    expect(consecutiveAbsenceDays(values, workingDays)).toBe(0);
  });
  it("does not treat a missing record as absent", () => expect(consecutiveAbsenceDays(records(2), [...workingDays, "2026-08-27"])).toBe(0));
});
describe("attendance percentage", () => {
  const days = ["2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27"];
  it("calculates full, half-day, and absent weights", () => {
    const result = calculateAttendance([
      { attendance_date: days[0], status: "present" },
      { attendance_date: days[1], status: "late" },
      { attendance_date: days[2], status: "half_day" },
      { attendance_date: days[3], status: "absent" },
    ], days);
    expect(result).toEqual({ recordedDays: 4, presentEquivalent: 2.5, percentage: 62.5 });
  });
  it("returns null for missing attendance", () => expect(calculateAttendance([], days).percentage).toBeNull());
  it("supports a partial period using only recorded days", () => expect(calculateAttendance([{ attendance_date: days[0], status: "present" }], days)).toEqual({ recordedDays: 1, presentEquivalent: 1, percentage: 100 }));
  it("returns no denominator when records fall outside working days", () => expect(calculateAttendance([{ attendance_date: "2026-08-23", status: "absent" }], days).recordedDays).toBe(0));
  it("does not warn at the exact 75% boundary", () => expect(lowAttendanceSeverity(75, 75, 65)).toBeNull());
  it("warns at the exact 65% critical boundary and is critical only below it", () => {
    expect(lowAttendanceSeverity(65, 75, 65)).toBe("WARNING");
    expect(lowAttendanceSeverity(64.99, 75, 65)).toBe("CRITICAL");
  });
});

describe("attendance decline", () => {
  it("keeps a sub-threshold decline stable", () => expect(attendanceTrend(82, 91, 10)).toEqual({ differencePoints: -9, status: "STABLE" }));
  it("flags a ten percentage-point decline", () => expect(attendanceTrend(81, 91, 10)).toEqual({ differencePoints: -10, status: "DECLINING" }));
  it("detects improvement", () => expect(attendanceTrend(92, 88, 10).status).toBe("IMPROVING"));
  it("requires a previous period", () => expect(attendanceTrend(92, null, 10).status).toBe("INSUFFICIENT_DATA"));
});

describe("staff leave", () => {
  it("recognizes an approved leave date so it can be excluded from unauthorized absence", () => {
    expect(isDateCoveredByApprovedLeave("staff-1", "2026-08-25", [{ staff_id: "staff-1", start_date: "2026-08-24", end_date: "2026-08-26" }])).toBe(true);
    expect(isDateCoveredByApprovedLeave("staff-2", "2026-08-25", [{ staff_id: "staff-1", start_date: "2026-08-24", end_date: "2026-08-26" }])).toBe(false);
  });
});

describe("alert lifecycle deduplication", () => {
  it("creates a missing fingerprint", () => expect(alertRefreshDecision(null)).toBe("CREATE"));
  it("updates an open fingerprint instead of duplicating it", () => expect(alertRefreshDecision("OPEN")).toBe("UPDATE"));
  it("keeps acknowledged conditions deduplicated", () => expect(alertRefreshDecision("ACKNOWLEDGED")).toBe("UPDATE"));
  it("reopens a resolved fingerprint", () => expect(alertRefreshDecision("RESOLVED")).toBe("REOPEN"));
  it("auto-resolves only when an active condition disappears", () => {
    expect(shouldAutoResolveAlert(true, false)).toBe(true);
    expect(shouldAutoResolveAlert(true, true)).toBe(false);
  });
});
