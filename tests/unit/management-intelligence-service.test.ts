import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  alertDestination,
  getManagementOverview,
  getPerformanceIntelligence,
  hasAcademicResolutionEvidence,
  hasAttendanceResolutionEvidence,
  hasPerformanceResolutionEvidence,
} from "@/features/management-intelligence/service";
import type { ManagementAlert, StaffInsight, StudentInsight, StudentPerformanceInsight } from "@/features/management-intelligence/types";

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
    staffId: "staff-1", staffNo: "STF-1", staffName: "Test Staff", presentDays: 0, recordedWorkingDays: 3, expectedWorkingDays: 3,
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

describe("phase 2b: academic alert auto-resolution requires positive evidence", () => {
  it("does not resolve when the class/subject has become insufficient data (deleted plan, removed assignment, etc.)", () => {
    expect(hasAcademicResolutionEvidence("INSUFFICIENT_DATA")).toBe(false);
    expect(hasAcademicResolutionEvidence(undefined)).toBe(false);
  });
  it("does not resolve while still WARNING or CRITICAL", () => {
    expect(hasAcademicResolutionEvidence("WARNING")).toBe(false);
    expect(hasAcademicResolutionEvidence("CRITICAL")).toBe(false);
  });
  it("resolves once evaluated and back on track", () => {
    expect(hasAcademicResolutionEvidence("ON_TRACK")).toBe(true);
    expect(hasAcademicResolutionEvidence("SLIGHTLY_BEHIND")).toBe(true);
  });
});

describe("phase 2b: performance alert auto-resolution requires newer comparable evidence", () => {
  function insight(values: Partial<StudentPerformanceInsight> = {}): Pick<StudentPerformanceInsight, "latestOverallPercentage" | "trend" | "failedSubjects" | "subjectsRequiringAttention"> {
    return { latestOverallPercentage: 80, trend: "STABLE", failedSubjects: [], subjectsRequiringAttention: [], ...values };
  }
  it("does not resolve a decline alert when the student has no evaluated result in the newer exam", () => {
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ latestOverallPercentage: null }))).toBe(false);
  });
  it("does not resolve a decline alert on INSUFFICIENT_DATA — missing data is not recovery", () => {
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ trend: "INSUFFICIENT_DATA" }))).toBe(false);
  });
  it("does not resolve a decline alert while still declining", () => {
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ trend: "DECLINING" }))).toBe(false);
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ trend: "STRONGLY_DECLINING" }))).toBe(false);
  });
  it("resolves a decline alert on genuinely comparable, non-declining evidence", () => {
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ trend: "STABLE" }))).toBe(true);
    expect(hasPerformanceResolutionEvidence("student_performance_decline", insight({ trend: "IMPROVING" }))).toBe(true);
  });
  it("resolves a failed-subjects alert only once evaluated with no failures", () => {
    expect(hasPerformanceResolutionEvidence("failed_subjects", insight({ latestOverallPercentage: null, failedSubjects: [] }))).toBe(false);
    expect(hasPerformanceResolutionEvidence("failed_subjects", insight({ failedSubjects: ["Math"] }))).toBe(false);
    expect(hasPerformanceResolutionEvidence("failed_subjects", insight({ failedSubjects: [] }))).toBe(true);
  });
  it("resolves a multiple-subject-attention alert only once below the 2-subject threshold", () => {
    expect(hasPerformanceResolutionEvidence("multiple_subject_decline", insight({ subjectsRequiringAttention: [{ subjectName: "A", reason: "x" }, { subjectName: "B", reason: "y" }] }))).toBe(false);
    expect(hasPerformanceResolutionEvidence("multiple_subject_decline", insight({ subjectsRequiringAttention: [{ subjectName: "A", reason: "x" }] }))).toBe(true);
  });
});

describe("phase 2b: attendance coverage is scoped to the active roster", () => {
  const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  function addDaysISO(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function fakeSupabase(tables: Record<string, unknown[]>): SupabaseClient {
    function builder(table: string) {
      const rows = tables[table] ?? [];
      const result = { data: rows, error: null, count: rows.length };
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "gte", "lte", "order", "in", "neq"]) {
        chain[method] = () => chain;
      }
      chain.maybeSingle = () => Promise.resolve({ data: rows[0] ?? null, error: null });
      chain.then = (resolve: (value: typeof result) => unknown) => resolve(result);
      return chain;
    }
    return {
      from: (table: string) => builder(table),
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as unknown as SupabaseClient;
  }

  it("does not let attendance rows for students outside the active roster inflate recorded/coverage (200 active, 160 recorded, +10 inactive-student rows)", async () => {
    const rosterIds = Array.from({ length: 200 }, (_, i) => `student-${i + 1}`);
    const roster = rosterIds.map((id, i) => ({
      student_id: id,
      class_id: "class-1",
      section_id: "section-1",
      students: { admission_no: `A${i + 1}`, first_name: "S", last_name: String(i + 1), status: "active" },
      classes: { name: "Class 1" },
      sections: { name: "A" },
    }));
    const activeStudentAttendance = rosterIds.slice(0, 160).map((id) => ({ student_id: id, attendance_date: TODAY, status: "present" }));
    const inactiveStudentAttendance = Array.from({ length: 10 }, (_, i) => ({ student_id: `not-in-roster-${i + 1}`, attendance_date: TODAY, status: "present" }));

    const staffIds = Array.from({ length: 10 }, (_, i) => `staff-${i + 1}`);
    const staff = staffIds.map((id, i) => ({ id, staff_no: `STF${i + 1}`, first_name: "T", last_name: String(i + 1) }));
    const approvedLeaveStaffIds = ["staff-1", "staff-2"];
    const leaveRequests = approvedLeaveStaffIds.map((id) => ({ staff_id: id, start_date: TODAY, end_date: TODAY }));
    const expectedStaffIds = staffIds.filter((id) => !approvedLeaveStaffIds.includes(id)); // 8 staff
    const activeStaffAttendance = expectedStaffIds.slice(0, 6).map((id) => ({ staff_id: id, attendance_date: TODAY, status: "present" }));
    const ghostStaffAttendance = ["ghost-staff-1", "ghost-staff-2"].map((id) => ({ staff_id: id, attendance_date: TODAY, status: "present" }));

    const supabase = fakeSupabase({
      academic_years: [{ id: "year-1", year_label: "2026-27", start_date: addDaysISO(TODAY, -30), end_date: addDaysISO(TODAY, 30), is_current: true }],
      management_intelligence_settings: [],
      student_enrollments: roster,
      student_attendance: [...activeStudentAttendance, ...inactiveStudentAttendance],
      staff,
      staff_attendance: [...activeStaffAttendance, ...ghostStaffAttendance],
      leave_requests: leaveRequests,
      school_weekly_off_days: [],
      academic_calendar_days: [],
      management_alerts: [],
    });

    const overview = await getManagementOverview(supabase);

    expect(overview.students.active).toBe(200);
    expect(overview.students.coverageToday).toEqual({ activeCount: 200, recordedCount: 160, missingCount: 40, coveragePercentage: 80, status: "PARTIAL" });

    expect(overview.staff.active).toBe(10);
    expect(overview.staff.approvedLeaveToday).toBe(2);
    expect(overview.staff.expectedToday).toBe(8);
    expect(overview.staff.coverageToday).toEqual({ activeCount: 8, recordedCount: 6, missingCount: 2, coveragePercentage: 75, status: "INCOMPLETE" });
  });

  it("reports NOT_EXPECTED coverage on a non-working day instead of a false missing-attendance alarm", async () => {
    const roster = Array.from({ length: 5 }, (_, i) => ({
      student_id: `student-${i + 1}`,
      class_id: "class-1",
      section_id: "section-1",
      students: { admission_no: `A${i + 1}`, first_name: "S", last_name: String(i + 1), status: "active" },
      classes: { name: "Class 1" },
      sections: { name: "A" },
    }));
    // Weekly off day covers every day of the week (0-6), so `today` is
    // always a non-working day regardless of when the test runs.
    const supabase = fakeSupabase({
      academic_years: [{ id: "year-1", year_label: "2026-27", start_date: addDaysISO(TODAY, -30), end_date: addDaysISO(TODAY, 30), is_current: true }],
      management_intelligence_settings: [],
      student_enrollments: roster,
      student_attendance: [],
      staff: [],
      staff_attendance: [],
      leave_requests: [],
      school_weekly_off_days: [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({ day_of_week })),
      academic_calendar_days: [],
      management_alerts: [],
    });

    const overview = await getManagementOverview(supabase);
    expect(overview.todayIsWorkingDay).toBe(false);
    expect(overview.students.coverageToday.status).toBe("NOT_EXPECTED");
    expect(overview.students.coverageToday.missingCount).toBe(0);
  });
});

describe("phase 2c: Term filter never hides a valid comparator in another term", () => {
  // A filter-aware fake client: unlike a canned-per-table mock, this one
  // actually applies .eq/.in against the table's rows, which matters here
  // because listResultsForSchedules is called twice with different id sets
  // and must return different rows each time.
  function filterAwareSupabase(tables: Record<string, Record<string, unknown>[]>): SupabaseClient {
    function builder(table: string) {
      let rows = tables[table] ?? [];
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.order = () => chain;
      chain.eq = (col: string, val: unknown) => {
        if (col.includes(".")) return chain; // nested Postgrest embed filters (e.g. "students.status") are pre-baked into fixtures
        rows = rows.filter((r) => r[col] === val);
        return chain;
      };
      chain.in = (col: string, vals: unknown[]) => {
        rows = rows.filter((r) => vals.includes(r[col]));
        return chain;
      };
      chain.gte = () => chain;
      chain.lte = () => chain;
      chain.maybeSingle = () => Promise.resolve({ data: rows[0] ?? null, error: null });
      chain.then = (resolve: (value: { data: unknown; error: null; count: number }) => unknown) =>
        resolve({ data: rows, error: null, count: rows.length });
      return chain;
    }
    return { from: (table: string) => builder(table) } as unknown as SupabaseClient;
  }

  function buildFixture() {
    return {
      academic_years: [{ id: "year-1", year_label: "2026-27", start_date: "2026-01-01", end_date: "2026-12-31", is_current: true }],
      exam_terms: [
        { id: "term-1", academic_year_id: "year-1", name: "Term 1" },
        { id: "term-2", academic_year_id: "year-1", name: "Term 2" },
      ],
      exams: [
        { id: "exam-1", term_id: "term-1", name: "Term Exam #1", description: null, status: "completed", comparison_group: "Term Exams", sequence_no: 1, created_at: "2026-01-15", updated_at: "", created_by: null, updated_by: null },
        { id: "exam-2", term_id: "term-2", name: "Term Exam #2", description: null, status: "completed", comparison_group: "Term Exams", sequence_no: 2, created_at: "2026-06-15", updated_at: "", created_by: null, updated_by: null },
      ],
      exam_schedules: [
        { id: "sched-1", exam_id: "exam-1", class_id: "class-1", subject_id: "subject-math", exam_date: "2026-01-20", start_time: "09:00", end_time: "10:00", room_no: null, max_marks_theory: 100, max_marks_practical: 0, pass_marks: 33, result_status: "published", created_at: "", updated_at: "", created_by: null, updated_by: null },
        { id: "sched-2", exam_id: "exam-2", class_id: "class-1", subject_id: "subject-math", exam_date: "2026-06-20", start_time: "09:00", end_time: "10:00", room_no: null, max_marks_theory: 100, max_marks_practical: 0, pass_marks: 33, result_status: "published", created_at: "", updated_at: "", created_by: null, updated_by: null },
      ],
      exam_results: [
        { id: "res-1", exam_schedule_id: "sched-1", student_id: "student-1", marks_theory: 70, marks_practical: null, attendance_status: "present", note: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
        { id: "res-2", exam_schedule_id: "sched-2", student_id: "student-1", marks_theory: 80, marks_practical: null, attendance_status: "present", note: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
      ],
      grade_scales: [{ id: "g1", grade_name: "Pass", min_percentage: 0, max_percentage: 100, grade_point: 0, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null }],
      management_intelligence_settings: [],
      student_enrollments: [
        {
          student_id: "student-1",
          academic_year_id: "year-1",
          class_id: "class-1",
          section_id: "section-1",
          students: { admission_no: "A001", first_name: "Asha", last_name: "K", status: "active" },
          classes: { name: "Class 1" },
          sections: { name: "A" },
        },
      ],
      subjects: [{ id: "subject-math", name: "Mathematics", class_id: "class-1", code: null, subject_type: "theory" }],
    };
  }

  it("finds Term Exam #1 as the comparator for Term Exam #2 even when the Term filter is set to Term 2", async () => {
    const supabase = filterAwareSupabase(buildFixture());
    const result = await getPerformanceIntelligence(supabase, { termId: "term-2" });
    expect(result.selectedExam?.id).toBe("exam-2");
    expect(result.previousExam?.id).toBe("exam-1");
    const student = result.insights.find((row) => row.studentId === "student-1");
    expect(student?.previousComparablePercentage).toBe(70);
    expect(student?.currentComparablePercentage).toBe(80);
  });

  it("still only lists Term 2's own exam as selectable when Term 2 is the filter", async () => {
    const supabase = filterAwareSupabase(buildFixture());
    const result = await getPerformanceIntelligence(supabase, { termId: "term-2" });
    expect(result.exams.map((e) => e.id)).toEqual(["exam-2"]);
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
