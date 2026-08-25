import { computeGrade } from "@/features/exams/grading";
import type { GradeScale } from "@/types/exams";
import { denseRankByScore, performanceTrend } from "./rules";
import type { CoverageStatus, StudentPerformanceInsight, SubjectPerformance } from "./types";

/**
 * Comparable-exam logic (documented, per the requirement not to compare
 * unrelated exams blindly): a student's "latest" performance is their valid,
 * authoritative (published/locked) results in a single selected exam; their
 * "previous comparable" performance is their valid results in the most
 * recent earlier exam within the SAME academic year (ordered by exam
 * creation time, since exams have no explicit sequence number). A subject
 * trend additionally requires the SAME subject to appear in both exams.
 * A student with no valid result in the selected exam, or no earlier exam
 * with a valid result, is INSUFFICIENT_DATA — never a fabricated decline.
 */

export interface PerformanceResultRow {
  studentId: string;
  subjectId: string;
  subjectName: string;
  marksTheory: number | null;
  marksPractical: number | null;
  maxMarksTheory: number;
  maxMarksPractical: number;
  passMarks: number;
}

export interface PerformanceRosterEntry {
  studentId: string;
  admissionNo: string;
  studentName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
}

function groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const value of values) result.set(key(value), [...(result.get(key(value)) ?? []), value]);
  return result;
}

export function summarizeStudentPerformance(params: {
  roster: PerformanceRosterEntry[];
  selectedExamId: string | null;
  selectedExamName: string | null;
  selectedExamResults: PerformanceResultRow[];
  previousExamResults: PerformanceResultRow[];
  gradeScales: GradeScale[];
  changePoints: number;
  strongChangePoints: number;
  attentionScorePct: number;
}): StudentPerformanceInsight[] {
  const {
    roster,
    selectedExamId,
    selectedExamName,
    selectedExamResults,
    previousExamResults,
    gradeScales,
    changePoints,
    strongChangePoints,
    attentionScorePct,
  } = params;

  const gradeOf = (row: PerformanceResultRow) =>
    computeGrade(
      {
        theory: row.marksTheory,
        practical: row.marksPractical,
        maxTheory: row.maxMarksTheory,
        maxPractical: row.maxMarksPractical,
        passMarks: row.passMarks,
      },
      gradeScales,
    );

  const selectedByStudent = groupBy(selectedExamResults, (row) => row.studentId);
  const previousByStudent = groupBy(previousExamResults, (row) => row.studentId);

  const withoutRank: (Omit<StudentPerformanceInsight, "classRank"> & { classId: string; sectionId: string })[] = roster.map(
    (student) => {
      const rows = selectedByStudent.get(student.studentId) ?? [];
      const previousRows = previousByStudent.get(student.studentId) ?? [];
      const previousBySubject = new Map(previousRows.map((row) => [row.subjectId, row]));

      const subjects: SubjectPerformance[] = [];
      const failedSubjects: string[] = [];
      const subjectsRequiringAttention: { subjectName: string; reason: string }[] = [];
      let sumPct = 0;
      let countPct = 0;

      for (const row of rows) {
        const grade = gradeOf(row);
        if (!grade) continue; // no marks entered for this subject — not evaluated
        const pct = Math.round(grade.percentage * 100) / 100;
        sumPct += pct;
        countPct += 1;

        const previousRow = previousBySubject.get(row.subjectId);
        const previousGrade = previousRow ? gradeOf(previousRow) : null;
        const previousPct = previousGrade ? Math.round(previousGrade.percentage * 100) / 100 : null;
        const trend = performanceTrend(pct, previousPct, changePoints, strongChangePoints);
        subjects.push({ subjectId: row.subjectId, subjectName: row.subjectName, percentage: pct, isPass: grade.isPass, trend });

        if (!grade.isPass) failedSubjects.push(row.subjectName);
        const reasons: string[] = [];
        if (!grade.isPass) reasons.push(`${row.subjectName} is failing at ${pct}% (below the pass mark).`);
        if (pct < attentionScorePct) reasons.push(`${row.subjectName} scored ${pct}%, below the ${attentionScorePct}% attention threshold.`);
        if (trend.status === "DECLINING" || trend.status === "STRONGLY_DECLINING") {
          reasons.push(`${row.subjectName} decreased from ${previousPct}% to ${pct}% (${trend.differencePoints} percentage points).`);
        }
        if (reasons.length) subjectsRequiringAttention.push({ subjectName: row.subjectName, reason: reasons.join(" ") });
      }

      const latestPercentage = countPct > 0 ? Math.round((sumPct / countPct) * 100) / 100 : null;

      let previousSum = 0;
      let previousCount = 0;
      for (const row of previousRows) {
        const grade = gradeOf(row);
        if (!grade) continue;
        previousSum += grade.percentage;
        previousCount += 1;
      }
      const previousPercentage = previousCount > 0 ? Math.round((previousSum / previousCount) * 100) / 100 : null;
      const overallTrend = performanceTrend(latestPercentage, previousPercentage, changePoints, strongChangePoints);

      const attentionReasons: string[] = [];
      if (overallTrend.status === "DECLINING" || overallTrend.status === "STRONGLY_DECLINING") {
        attentionReasons.push(
          `Overall performance changed from ${previousPercentage}% to ${latestPercentage}% (${overallTrend.differencePoints} percentage points).`,
        );
      }
      if (failedSubjects.length > 0) {
        attentionReasons.push(`Failing ${failedSubjects.length} subject${failedSubjects.length > 1 ? "s" : ""}: ${failedSubjects.join(", ")}.`);
      }
      if (subjectsRequiringAttention.length >= 2) {
        attentionReasons.push(`${subjectsRequiringAttention.length} subjects require attention.`);
      }

      const dataCoverage: CoverageStatus = countPct === 0 ? "NOT_RECORDED" : rows.length > countPct ? "PARTIAL" : "COMPLETE";

      return {
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        classId: student.classId,
        className: student.className,
        sectionId: student.sectionId,
        sectionName: student.sectionName,
        latestExamId: countPct > 0 ? selectedExamId : null,
        latestExamName: countPct > 0 ? selectedExamName : null,
        latestPercentage,
        previousPercentage,
        differencePoints: overallTrend.differencePoints,
        trend: overallTrend.status,
        subjects,
        failedSubjects,
        subjectsRequiringAttention,
        dataCoverage,
        requiresAttention: attentionReasons.length > 0,
        attentionReasons,
      };
    },
  );

  const byClassSection = groupBy(withoutRank, (row) => `${row.classId}:${row.sectionId}`);
  const rankByStudentId = new Map<string, number>();
  for (const group of byClassSection.values()) {
    const ranked = group.filter((row) => row.latestPercentage !== null);
    const ranks = denseRankByScore(ranked.map((row) => row.latestPercentage!));
    ranked.forEach((row, index) => rankByStudentId.set(row.studentId, ranks[index]));
  }

  return withoutRank.map((row) => ({ ...row, classRank: rankByStudentId.get(row.studentId) ?? null }));
}

export interface ClassPerformanceGroup {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  studentsAssessed: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  median: number | null;
  passPercentage: number | null;
}

export function summarizeClassPerformance(insights: StudentPerformanceInsight[]): ClassPerformanceGroup[] {
  const groups = groupBy(
    insights.map((insight) => ({ ...insight, classId: insight.classId, sectionId: insight.sectionId })),
    (row) => `${row.classId}:${row.sectionId}`,
  );
  const result: ClassPerformanceGroup[] = [];
  for (const group of groups.values()) {
    const scores = group.map((row) => row.latestPercentage).filter((value): value is number => value !== null);
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted.length === 0 ? null : sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : Math.round(((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) * 100) / 100;
    const evaluated = group.filter((row) => row.latestPercentage !== null);
    const passCount = evaluated.filter((row) => row.failedSubjects.length === 0).length;
    result.push({
      classId: group[0].classId,
      className: group[0].className,
      sectionId: group[0].sectionId,
      sectionName: group[0].sectionName,
      studentsAssessed: evaluated.length,
      average: scores.length > 0 ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100) / 100 : null,
      highest: scores.length > 0 ? Math.max(...scores) : null,
      lowest: scores.length > 0 ? Math.min(...scores) : null,
      median,
      passPercentage: evaluated.length > 0 ? Math.round((passCount / evaluated.length) * 10_000) / 100 : null,
    });
  }
  return result;
}
