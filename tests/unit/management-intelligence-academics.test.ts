import { describe, expect, it } from "vitest";
import { summarizeAcademicDelivery } from "@/features/management-intelligence/academics";
import type { LessonPlan } from "@/types/teaching";

const workingDays = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28"];

function plan(overrides: Partial<LessonPlan>): LessonPlan {
  return {
    id: overrides.id ?? "plan-1",
    academic_year_id: "year-1",
    class_id: "class-1",
    subject_id: "subject-1",
    topic_title: "Topic",
    description: null,
    planned_date: "2026-08-17",
    status: "pending",
    created_at: "",
    updated_at: "",
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

const row = {
  classId: "class-1",
  className: "Class 1",
  sectionId: "section-1",
  sectionName: "A",
  subjectId: "subject-1",
  subjectName: "Mathematics",
  teacherId: "teacher-1",
  teacherName: "Teacher One",
};

describe("academic delivery: insufficient data", () => {
  it("is INSUFFICIENT_DATA with no lesson plans at all", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [],
      asOfDate: "2026-08-28",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.dataCoverage).toBe("NOT_RECORDED");
    expect(result.lagDays).toBeNull();
  });

  it("is PARTIAL coverage when every plan is still in the future", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-09-05" })],
      asOfDate: "2026-08-28",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.dataCoverage).toBe("PARTIAL");
  });
});

describe("academic delivery: lag thresholds 0/1/3/4/7/8 days", () => {
  it("is ON_TRACK when every due plan is completed", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "completed" })],
      asOfDate: "2026-08-17",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(0);
    expect(result.status).toBe("ON_TRACK");
  });

  it("is SLIGHTLY_BEHIND at a 1-working-day-old pending plan", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-18",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(1);
    expect(result.status).toBe("SLIGHTLY_BEHIND");
  });

  it("is SLIGHTLY_BEHIND at 3 working days", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-20",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(3);
    expect(result.status).toBe("SLIGHTLY_BEHIND");
  });

  it("is WARNING at 4 working days", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-21",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(4);
    expect(result.status).toBe("WARNING");
  });

  it("is WARNING at 7 working days", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-26",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(7);
    expect(result.status).toBe("WARNING");
  });

  it("is CRITICAL at 8 working days and beyond", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-27",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.lagDays).toBe(8);
    expect(result.status).toBe("CRITICAL");
  });
});

describe("phase 2c: one intelligence unit per class+subject, never one per assignment", () => {
  it("collapses 3 sections and 2 teachers into ONE unit with assignedSections/assignedTeachers context", () => {
    const assignments = [
      { ...row, sectionId: "section-a", sectionName: "A", teacherId: "teacher-1", teacherName: "Teacher One" },
      { ...row, sectionId: "section-b", sectionName: "B", teacherId: "teacher-1", teacherName: "Teacher One" },
      { ...row, sectionId: "section-c", sectionName: "C", teacherId: "teacher-2", teacherName: "Teacher Two" },
    ];
    const result = summarizeAcademicDelivery({
      assignments,
      lessonPlans: [plan({ planned_date: "2026-08-17", status: "pending" })],
      asOfDate: "2026-08-21",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result).toHaveLength(1);
    expect(result[0].assignedSections.map((s) => s.sectionName)).toEqual(["A", "B", "C"]);
    expect(result[0].assignedTeachers.map((t) => t.teacherName)).toEqual(["Teacher One", "Teacher Two"]);
    // The delivery evidence itself is identical regardless of section/teacher count.
    expect(result[0].lagDays).toBe(4);
    expect(result[0].status).toBe("WARNING");
  });

  it("keeps distinct class+subject pairs as separate units", () => {
    const assignments = [
      { ...row, subjectId: "subject-1", subjectName: "Mathematics" },
      { ...row, subjectId: "subject-2", subjectName: "Science" },
    ];
    const result = summarizeAcademicDelivery({
      assignments,
      lessonPlans: [],
      asOfDate: "2026-08-21",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result).toHaveLength(2);
  });
});

describe("academic delivery: expected/actual progress and evidence coverage", () => {
  it("counts only due plans toward expected progress, and completed-due plans toward actual", () => {
    const [result] = summarizeAcademicDelivery({
      assignments: [row],
      lessonPlans: [
        plan({ id: "p1", planned_date: "2026-08-17", status: "completed" }),
        plan({ id: "p2", planned_date: "2026-08-18", status: "completed" }),
        plan({ id: "p3", planned_date: "2026-08-19", status: "pending" }),
        plan({ id: "p4", planned_date: "2026-09-05", status: "pending" }), // not yet due
      ],
      asOfDate: "2026-08-20",
      workingDays,
      slightlyBehindDays: 1,
      warningDays: 4,
      criticalDays: 8,
    });
    expect(result.expectedProgress).toBe(3);
    expect(result.actualProgress).toBe(2);
    expect(result.pendingTopics).toBe(1);
    expect(result.evidenceCoveragePercentage).toBeCloseTo(66.67, 1);
    expect(result.dataCoverage).toBe("COMPLETE");
  });
});
