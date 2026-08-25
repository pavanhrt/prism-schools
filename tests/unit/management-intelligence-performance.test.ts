import { describe, expect, it } from "vitest";
import { selectPreviousComparableExam, summarizeClassPerformance, summarizeStudentPerformance } from "@/features/management-intelligence/performance";
import type { GradeScale } from "@/types/exams";

const gradeScales: GradeScale[] = [
  { id: "g1", grade_name: "A", min_percentage: 90, max_percentage: 100, grade_point: 10, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
  { id: "g2", grade_name: "B", min_percentage: 0, max_percentage: 89.99, grade_point: 0, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
];

const roster = [
  { studentId: "s1", admissionNo: "A001", studentName: "Asha", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" },
  { studentId: "s2", admissionNo: "A002", studentName: "Bala", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" },
  { studentId: "s3", admissionNo: "A003", studentName: "Chitra", classId: "c1", className: "Class 1", sectionId: "sec1", sectionName: "A" },
];

const subjectRow = (studentId: string, marksTheory: number | null, subjectId = "math") => ({
  studentId,
  subjectId,
  subjectName: subjectId === "math" ? "Mathematics" : "Science",
  marksTheory,
  marksPractical: null,
  maxMarksTheory: 100,
  maxMarksPractical: 0,
  passMarks: 33,
});

describe("performance: exam comparability", () => {
  it("is INSUFFICIENT_DATA with no previous comparable exam", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-2",
      selectedExamName: "Term 2",
      selectedExamResults: [subjectRow("s1", 80)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(result.latestPercentage).toBe(80);
    expect(result.previousPercentage).toBeNull();
    expect(result.trend).toBe("INSUFFICIENT_DATA");
  });

  it("does not evaluate a student with no marks entered in the selected exam", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-2",
      selectedExamName: "Term 2",
      selectedExamResults: [subjectRow("s1", null)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(result.latestPercentage).toBeNull();
    expect(result.dataCoverage).toBe("NOT_RECORDED");
    expect(result.latestExamId).toBeNull();
  });

  it("computes overall and subject trend against the same-subject previous result", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-2",
      selectedExamName: "Term 2",
      selectedExamResults: [subjectRow("s1", 61)],
      previousExamResults: [subjectRow("s1", 76)],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(result.latestPercentage).toBe(61);
    expect(result.previousPercentage).toBe(76);
    expect(result.differencePoints).toBe(-15);
    expect(result.trend).toBe("STRONGLY_DECLINING");
    expect(result.subjects[0].trend.status).toBe("STRONGLY_DECLINING");
    expect(result.subjectsRequiringAttention[0].reason).toContain("Mathematics decreased from 76% to 61% (-15 percentage points)");
  });

  it("flags a failed subject and a below-threshold score with explicit reasons", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-1",
      selectedExamName: "Term 1",
      selectedExamResults: [subjectRow("s1", 20)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(result.failedSubjects).toEqual(["Mathematics"]);
    expect(result.requiresAttention).toBe(true);
    expect(result.attentionReasons.join(" ")).toContain("Failing 1 subject");
  });

  it("never uses Weak/Poor/Bad/Low Student language in reasons", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-1",
      selectedExamName: "Term 1",
      selectedExamResults: [subjectRow("s1", 20)],
      previousExamResults: [subjectRow("s1", 80)],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    const text = result.attentionReasons.join(" ") + result.subjectsRequiringAttention.map((r) => r.reason).join(" ");
    expect(text.toLowerCase()).not.toMatch(/weak|poor student|bad student|low student/);
  });
});

describe("phase 2b: explicit exam comparability (never inferred)", () => {
  it("has no previous exam when the selected exam has no comparison_group at all — unrelated exams are never compared", () => {
    const result = selectPreviousComparableExam(
      { id: "exam-2", comparisonGroup: null, sequenceNo: null },
      [{ id: "exam-1", comparisonGroup: null, sequenceNo: null }],
    );
    expect(result).toBeNull();
  });

  it("has no previous exam when candidates share no comparison_group, even with a plausible sequence", () => {
    const result = selectPreviousComparableExam(
      { id: "exam-2", comparisonGroup: "Term Exams", sequenceNo: 2 },
      [{ id: "exam-1", comparisonGroup: "Unit Tests", sequenceNo: 1 }],
    );
    expect(result).toBeNull();
  });

  it("selects the explicitly comparable exam with the highest lower sequence_no in the same group", () => {
    const result = selectPreviousComparableExam(
      { id: "exam-3", comparisonGroup: "Term Exams", sequenceNo: 3 },
      [
        { id: "exam-1", comparisonGroup: "Term Exams", sequenceNo: 1 },
        { id: "exam-2", comparisonGroup: "Term Exams", sequenceNo: 2 },
        { id: "exam-unrelated", comparisonGroup: "Unit Tests", sequenceNo: 2 },
      ],
    );
    expect(result?.id).toBe("exam-2");
  });

  it("never selects an exam at or after the same sequence_no as the selected exam", () => {
    const result = selectPreviousComparableExam(
      { id: "exam-2", comparisonGroup: "Term Exams", sequenceNo: 2 },
      [
        { id: "exam-2-dup", comparisonGroup: "Term Exams", sequenceNo: 2 },
        { id: "exam-3", comparisonGroup: "Term Exams", sequenceNo: 3 },
      ],
    );
    expect(result).toBeNull();
  });
});

describe("phase 2b: consistent subject-basis overall trend", () => {
  it("restricts the previous-comparable average to subjects also present in the current exam", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-2",
      selectedExamName: "Term 2",
      // current exam: only Math and Science
      selectedExamResults: [subjectRow("s1", 80, "math"), subjectRow("s1", 60, "science")],
      // previous exam: Math, Science, AND Social (an extra subject not retested)
      previousExamResults: [subjectRow("s1", 70, "math"), subjectRow("s1", 50, "science"), subjectRow("s1", 90, "social")],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    // previousPercentage must average only Math+Science (60), never include Social (90)
    expect(result.previousPercentage).toBe(60);
    // latestPercentage stays the full current-exam average (Math+Science = 70) — informational, not narrowed
    expect(result.latestPercentage).toBe(70);
    expect(result.differencePoints).toBe(10);
    expect(result.trend).toBe("STRONGLY_IMPROVING");
  });

  it("is INSUFFICIENT_DATA when no subject is common to both exams", () => {
    const [result] = summarizeStudentPerformance({
      roster: [roster[0]],
      selectedExamId: "exam-2",
      selectedExamName: "Term 2",
      selectedExamResults: [subjectRow("s1", 80, "math")],
      previousExamResults: [subjectRow("s1", 90, "social")],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(result.previousPercentage).toBeNull();
    expect(result.trend).toBe("INSUFFICIENT_DATA");
  });
});

describe("performance: ranking ties (dense rank)", () => {
  it("gives tied top scores the same rank with no gap for the next student", () => {
    const results = summarizeStudentPerformance({
      roster,
      selectedExamId: "exam-1",
      selectedExamName: "Term 1",
      selectedExamResults: [subjectRow("s1", 95), subjectRow("s2", 95), subjectRow("s3", 92)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    const byId = new Map(results.map((r) => [r.studentId, r.classRank]));
    expect(byId.get("s1")).toBe(1);
    expect(byId.get("s2")).toBe(1);
    expect(byId.get("s3")).toBe(2);
  });

  it("has no rank for a student with no evaluated percentage", () => {
    const results = summarizeStudentPerformance({
      roster,
      selectedExamId: "exam-1",
      selectedExamName: "Term 1",
      selectedExamResults: [subjectRow("s1", 95)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    expect(results.find((r) => r.studentId === "s2")!.classRank).toBeNull();
  });
});

describe("performance: class performance aggregation", () => {
  it("computes average, highest, lowest, median, and pass percentage", () => {
    const insights = summarizeStudentPerformance({
      roster,
      selectedExamId: "exam-1",
      selectedExamName: "Term 1",
      selectedExamResults: [subjectRow("s1", 90), subjectRow("s2", 60), subjectRow("s3", 20)],
      previousExamResults: [],
      gradeScales,
      changePoints: 3,
      strongChangePoints: 10,
      attentionScorePct: 40,
    });
    const [summary] = summarizeClassPerformance(insights);
    expect(summary.studentsAssessed).toBe(3);
    expect(summary.average).toBeCloseTo(56.67, 1);
    expect(summary.highest).toBe(90);
    expect(summary.lowest).toBe(20);
    expect(summary.median).toBe(60);
    expect(summary.passPercentage).toBeCloseTo(66.67, 1);
  });
});
