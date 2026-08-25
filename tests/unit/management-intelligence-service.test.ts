import { describe, expect, it } from "vitest";
import { alertDestination, hasAttendanceResolutionEvidence } from "@/features/management-intelligence/service";
import type { ManagementAlert, StaffInsight, StudentInsight } from "@/features/management-intelligence/types";

function alert(ruleKey: string, values: Partial<ManagementAlert> = {}): ManagementAlert {
  return {
    id: "alert-1", fingerprint: "fingerprint", rule_key: ruleKey, alert_type: "TEST", category: "ATTENDANCE",
    severity: "WARNING", entity_type: "student", entity_id: "student-1", student_id: "student-1", staff_id: null,
    class_id: null, section_id: null, subject_id: null, academic_year_id: "year-1", period_start: "2026-08-01",
    period_end: "2026-08-24", title: "Test", message: "Test", current_value: 3, threshold_value: 3,
    status: "OPEN", first_detected_at: "2026-08-20T00:00:00.000Z", last_detected_at: "2026-08-24T00:00:00.000Z",
    acknowledged_by: null, acknowledged_at: null, resolved_by: null, resolved_at: null,
    created_at: "2026-08-20T00:00:00.000Z", updated_at: "2026-08-24T00:00:00.000Z", ...values,
  };
}

function student(values: Partial<StudentInsight> = {}): StudentInsight {
  return {
    studentId: "student-1", admissionNo: "ADM-1", studentName: "Test Student", classId: "class-1", className: "Class 1",
    sectionId: "section-1", sectionName: "A", presentDays: 0, recordedWorkingDays: 5, attendancePercentage: 0,
    previousPercentage: 50, differencePoints: -50, consecutiveAbsenceDays: 5, latestRecordedAttendanceEvaluation: "ABSENT",
    trend: "DECLINING", severity: "CRITICAL", ...values,
  };
}

function staff(values: Partial<StaffInsight> = {}): StaffInsight {
  return {
    staffId: "staff-1", staffNo: "STF-1", staffName: "Test Staff", presentDays: 0, recordedWorkingDays: 3,
    attendancePercentage: 0, consecutiveAbsenceDays: 3, latestRecordedAttendanceEvaluation: "ABSENT", severity: "WARNING", ...values,
  };
}

describe("attendance alert auto-resolution evidence", () => {
  it("does not resolve a student absence from missing or continued-absence data", () => {
    expect(hasAttendanceResolutionEvidence(alert("student_consecutive_absence"), [student({ latestRecordedAttendanceEvaluation: "NOT_EVALUATED" })], [])).toBe(false);
    expect(hasAttendanceResolutionEvidence(alert("student_consecutive_absence"), [student({ latestRecordedAttendanceEvaluation: "ABSENT" })], [])).toBe(false);
  });

  it("resolves a student absence after explicit non-absence evidence", () => {
    expect(hasAttendanceResolutionEvidence(alert("student_consecutive_absence"), [student({ latestRecordedAttendanceEvaluation: "NON_ABSENT" })], [])).toBe(true);
  });

  it("does not resolve low-attendance or trend alerts when their metric is insufficient", () => {
    expect(hasAttendanceResolutionEvidence(alert("student_low_attendance"), [student({ attendancePercentage: null })], [])).toBe(false);
    expect(hasAttendanceResolutionEvidence(alert("student_attendance_decline"), [student({ differencePoints: null })], [])).toBe(false);
    expect(hasAttendanceResolutionEvidence(alert("student_low_attendance"), [], [])).toBe(false);
  });

  it("resolves evaluated low-attendance and trend conditions when no candidate remains", () => {
    expect(hasAttendanceResolutionEvidence(alert("student_low_attendance"), [student({ attendancePercentage: 90 })], [])).toBe(true);
    expect(hasAttendanceResolutionEvidence(alert("student_attendance_decline"), [student({ differencePoints: 5 })], [])).toBe(true);
  });

  it("requires explicit non-absence evidence for staff too", () => {
    const staffAlert = alert("staff_consecutive_absence", { entity_type: "staff", entity_id: "staff-1", student_id: null, staff_id: "staff-1", category: "STAFF" });
    expect(hasAttendanceResolutionEvidence(staffAlert, [], [staff({ latestRecordedAttendanceEvaluation: "NOT_EVALUATED" })])).toBe(false);
    expect(hasAttendanceResolutionEvidence(staffAlert, [], [staff({ latestRecordedAttendanceEvaluation: "NON_ABSENT" })])).toBe(true);
  });
});

describe("alert drill-down routing", () => {
  it("routes student alerts to the exact student attendance filter", () => {
    expect(alertDestination(alert("student_consecutive_absence"))).toBe("/admin/management-intelligence/attendance?student_id=student-1");
  });

  it("routes staff alerts to the staff record and leaves a future-safe fallback", () => {
    expect(alertDestination({ student_id: null, staff_id: "staff-1" })).toBe("/admin/staff/staff-1");
    expect(alertDestination({ student_id: null, staff_id: null })).toBe("/admin/management-intelligence/alerts");
  });

  it("routes performance alerts to the performance dashboard filtered by student", () => {
    expect(alertDestination({ student_id: "student-1", staff_id: null, category: "PERFORMANCE" })).toBe(
      "/admin/management-intelligence/performance?student_id=student-1",
    );
  });

  it("routes fee alerts to the student record", () => {
    expect(alertDestination({ student_id: "student-1", staff_id: null, category: "FEES" })).toBe("/admin/students/student-1");
  });

  it("routes academic alerts to the academics dashboard filtered by class/section/subject", () => {
    expect(
      alertDestination({ student_id: null, staff_id: null, category: "ACADEMICS", class_id: "class-1", section_id: "section-1", subject_id: "subject-1" }),
    ).toBe("/admin/management-intelligence/academics?class_id=class-1&section_id=section-1&subject_id=subject-1");
  });
});
