import { computeGrade } from "@/features/exams/grading";
import type { GradeScale } from "@/types/exams";
import { denseRankByScore, performanceTrend } from "./rules";
import type { CoverageStatus, StudentPerformanceInsight, SubjectPerformance } from "./types";

/**
 * Comparable-exam logic (Phase 2B — comparability is EXPLICIT, never
 * inferred): a student's "latest" performance is their valid, authoritative
 * (published/locked) results in a single selected exam. Their "previous
 * comparable" performance exists ONLY if the selected exam has a non-null
 * `comparison_group` and `sequence_no`, and an earlier exam shares that
 * exact comparison_group with a strictly lower sequence_no —
 * `selectPreviousComparableExam` below. created_at, exam name text, and
 * term ordering are never used to infer comparability; an exam with no
 * comparison_group can never be auto-compared to anything.
 *
 * A subject trend additionally requires the SAME subject to appear, with a
 * valid result, in both exams. The overall trend additionally requires a
 * consistent subject basis: both sides of the comparison are restricted to
 * subjects with a valid result in BOTH exams (see summarizeStudentPerformance
 * below) — a previous exam that also tested an extra subject never drags
 * the comparison off a like-for-like basis.
 *
 * A student with no valid result in the selected exam, no comparable
 * previous exam, or no common evaluated subject is INSUFFICIENT_DATA —
 * never a fabricated decline.
 */

export interface ComparableExamCandidate {
  id: string;
  comparisonGroup: string | null;
  sequenceNo: number | null;
}

export function selectPreviousComparableExam<T extends ComparableExamCandidate>(selectedExam: T, candidates: T[]): T | null {
  if (selectedExam.comparisonGroup === null || selectedExam.sequenceNo === null) return null;
  const eligible = candidates.filter(
    (exam) =>
      exam.id !== selectedExam.id &&
      exam.comparisonGroup === selectedExam.comparisonGroup &&
      exam.sequenceNo !== null &&
      exam.sequenceNo < selectedExam.sequenceNo!,
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, exam) => (exam.sequenceNo! > best.sequenceNo! ? exam : best));
}

/**
 * Phase 2C: the same explicit-comparability rule, applied to alert
 * auto-resolution — a NEWER exam only counts as recovery evidence for an
 * alert if it is genuinely comparable to the exam the alert was raised
 * against (same non-null comparison_group, strictly higher sequence_no).
 * `alertExam` being unknown, either exam missing its comparison metadata,
 * a different comparison_group, or a lower/equal sequence_no all mean
 * "not comparable" — never auto-resolved.
 */
export function isNewerComparableExam(alertExam: ComparableExamCandidate | undefined, currentExam: ComparableExamCandidate): boolean {
  if (!alertExam) return false;
  if (currentExam.comparisonGroup === null || alertExam.comparisonGroup === null) return false;
  if (alertExam.comparisonGroup !== currentExam.comparisonGroup) return false;
  if (alertExam.sequenceNo === null || currentExam.sequenceNo === null) return false;
  return currentExam.sequenceNo > alertExam.sequenceNo;
}

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

      const latestOverallPercentage = countPct > 0 ? Math.round((sumPct / countPct) * 100) / 100 : null;

      // The overall TREND must compare a consistent subject basis — never
      // the current exam's full average against a previous average built
      // from a different subject set (e.g. previous exam also tested
      // Social, current exam didn't). Both sides of the trend comparison
      // are restricted to the intersection of subjects with a valid,
      // evaluated result in BOTH exams: `currentComparablePercentage` and
      // `previousComparablePercentage`. `latestOverallPercentage` above
      // stays the full current-exam average (informational, "how the
      // student did this exam overall") and can legitimately differ from
      // `currentComparablePercentage` — the UI must show both distinctly
      // rather than implying the trend was computed from the overall figure.
      const evaluatedCurrentSubjectIds = new Set(rows.filter((row) => gradeOf(row) !== null).map((row) => row.subjectId));
      const commonSubjectIds = new Set(
        previousRows.filter((row) => gradeOf(row) !== null && evaluatedCurrentSubjectIds.has(row.subjectId)).map((row) => row.subjectId),
      );
      let previousSum = 0;
      let previousCount = 0;
      for (const row of previousRows) {
        if (!commonSubjectIds.has(row.subjectId)) continue;
        const grade = gradeOf(row);
        if (!grade) continue;
        previousSum += grade.percentage;
        previousCount += 1;
      }
      let currentBasisSum = 0;
      let currentBasisCount = 0;
      for (const row of rows) {
        if (!commonSubjectIds.has(row.subjectId)) continue;
        const grade = gradeOf(row);
        if (!grade) continue;
        currentBasisSum += grade.percentage;
        currentBasisCount += 1;
      }
      const previousComparablePercentage = previousCount > 0 ? Math.round((previousSum / previousCount) * 100) / 100 : null;
      const currentComparablePercentage = currentBasisCount > 0 ? Math.round((currentBasisSum / currentBasisCount) * 100) / 100 : null;
      const overallTrend = performanceTrend(currentComparablePercentage, previousComparablePercentage, changePoints, strongChangePoints);

      const attentionReasons: string[] = [];
      if (overallTrend.status === "DECLINING" || overallTrend.status === "STRONGLY_DECLINING") {
        attentionReasons.push(
          `Overall performance (on the subjects common to both exams) changed from ${previousComparablePercentage}% to ${currentComparablePercentage}% (${overallTrend.differencePoints} percentage points).`,
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
        latestOverallPercentage,
        currentComparablePercentage,
        previousComparablePercentage,
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
    const ranked = group.filter((row) => row.latestOverallPercentage !== null);
    const ranks = denseRankByScore(ranked.map((row) => row.latestOverallPercentage!));
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
    const scores = group.map((row) => row.latestOverallPercentage).filter((value): value is number => value !== null);
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted.length === 0 ? null : sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : Math.round(((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) * 100) / 100;
    const evaluated = group.filter((row) => row.latestOverallPercentage !== null);
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
