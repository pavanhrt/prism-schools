import type { GradeScale } from "@/types/exams";

/**
 * Pure grade computation — never stored, always derived at read time from
 * marks + the current grade_scales rows, so a later change to the grading
 * scale can't silently drift from what was actually recorded (the same
 * "derived, not stored+trusted" rule the blueprint applied to invoice
 * balances in §27).
 */

export interface MarksSummary {
  theory: number | null;
  practical: number | null;
  maxTheory: number;
  maxPractical: number;
  passMarks: number;
}

export interface GradeResult {
  totalMarks: number;
  totalMax: number;
  percentage: number;
  grade: GradeScale | null;
  isPass: boolean;
}

export function computeGrade(
  summary: MarksSummary,
  scales: GradeScale[],
): GradeResult | null {
  if (summary.theory === null && summary.practical === null) return null;

  const totalMarks = (summary.theory ?? 0) + (summary.practical ?? 0);
  const totalMax = summary.maxTheory + summary.maxPractical;
  const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
  const grade =
    scales.find((g) => percentage >= g.min_percentage && percentage <= g.max_percentage) ??
    null;
  const isPass = totalMarks >= summary.passMarks;

  return { totalMarks, totalMax, percentage, grade, isPass };
}
