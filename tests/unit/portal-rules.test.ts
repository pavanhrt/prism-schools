import { describe, expect, it } from "vitest";
import {
  compareSubjectProgress,
  computeAttendanceAlert,
  computeAttendanceBreakdown,
  consecutivePortalAbsences,
} from "@/features/portal/rules";

describe("portal attendance breakdown", () => {
  it("weights present/late as 1 and half_day as 0.5", () => {
    const result = computeAttendanceBreakdown([
      { status: "present" }, { status: "present" }, { status: "late" }, { status: "half_day" }, { status: "absent" },
    ]);
    expect(result).toEqual({ presentDays: 2, lateDays: 1, halfDays: 1, absentDays: 1, recordedDays: 5, percentage: 70 });
  });

  it("has no percentage when nothing is recorded — never a fabricated 0%", () => {
    expect(computeAttendanceBreakdown([]).percentage).toBeNull();
    expect(computeAttendanceBreakdown([]).recordedDays).toBe(0);
  });
});

describe("portal consecutive absences", () => {
  it("counts absences from the most recent recorded day backward", () => {
    const recent = [{ status: "absent" }, { status: "absent" }, { status: "absent" }, { status: "present" }];
    expect(consecutivePortalAbsences(recent)).toBe(3);
  });

  it("stops at the first non-absent record", () => {
    expect(consecutivePortalAbsences([{ status: "late" }, { status: "absent" }])).toBe(0);
  });

  it("is 0 with no records", () => {
    expect(consecutivePortalAbsences([])).toBe(0);
  });
});

describe("portal attendance alerts (rule-based, not AI)", () => {
  const thresholds = { warningConsecutiveDays: 2, criticalConsecutiveDays: 3, warningPercentage: 85, criticalPercentage: 75 };

  it("flags absent today when nothing more urgent applies", () => {
    expect(computeAttendanceAlert({ isAbsentToday: true, consecutiveAbsences: 0, percentage: 95, ...thresholds })).toEqual({
      level: "ABSENT_TODAY",
      label: "Absent today",
    });
  });

  it("flags 2 consecutive absences as a warning", () => {
    expect(computeAttendanceAlert({ isAbsentToday: true, consecutiveAbsences: 2, percentage: 95, ...thresholds }).level).toBe("CONSECUTIVE_WARNING");
  });

  it("flags 3+ consecutive absences as critical, taking priority over a lower warning", () => {
    expect(computeAttendanceAlert({ isAbsentToday: true, consecutiveAbsences: 3, percentage: 95, ...thresholds }).level).toBe("CONSECUTIVE_CRITICAL");
  });

  it("flags attendance below the configured threshold using the exact configured percentage in the label", () => {
    const result = computeAttendanceAlert({ isAbsentToday: false, consecutiveAbsences: 0, percentage: 82, ...thresholds });
    expect(result).toEqual({ level: "BELOW_THRESHOLD", label: "Attendance 82% — Needs Attention" });
  });

  it("has no alert when nothing crosses a configured threshold", () => {
    expect(computeAttendanceAlert({ isAbsentToday: false, consecutiveAbsences: 0, percentage: 95, ...thresholds }).level).toBeNull();
  });
});

describe("portal subject progress comparison (deterministic, no AI text generation)", () => {
  it("is INSUFFICIENT_DATA with no previous comparable result", () => {
    expect(compareSubjectProgress(null, 81, 3)).toEqual({ differencePoints: null, label: "INSUFFICIENT_DATA" });
  });

  it("labels a rise beyond the stable band as IMPROVED", () => {
    expect(compareSubjectProgress(72, 81, 3)).toEqual({ differencePoints: 9, label: "IMPROVED" });
  });

  it("labels a drop beyond the stable band as DECLINED", () => {
    expect(compareSubjectProgress(84, 79, 3)).toEqual({ differencePoints: -5, label: "DECLINED" });
  });

  it("labels a change within the stable band as STABLE", () => {
    expect(compareSubjectProgress(80, 82, 3)).toEqual({ differencePoints: 2, label: "STABLE" });
  });
});
