import { describe, expect, it } from "vitest";
import { computeGrade } from "@/features/exams/grading";
import type { GradeScale } from "@/types/exams";

const scales: GradeScale[] = [
  { id: "1", grade_name: "A+", min_percentage: 90, max_percentage: 100, grade_point: 10, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
  { id: "2", grade_name: "A", min_percentage: 75, max_percentage: 89.99, grade_point: 9, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
  { id: "3", grade_name: "B", min_percentage: 60, max_percentage: 74.99, grade_point: 7, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
  { id: "4", grade_name: "F", min_percentage: 0, max_percentage: 32.99, grade_point: 0, description: null, created_at: "", updated_at: "", created_by: null, updated_by: null },
];

describe("computeGrade", () => {
  it("returns null when no marks have been entered at all", () => {
    expect(
      computeGrade({ theory: null, practical: null, maxTheory: 80, maxPractical: 20, passMarks: 33 }, scales),
    ).toBeNull();
  });

  it("computes percentage across theory + practical against their combined max", () => {
    const result = computeGrade(
      { theory: 72, practical: 18, maxTheory: 80, maxPractical: 20, passMarks: 33 },
      scales,
    );
    expect(result?.totalMarks).toBe(90);
    expect(result?.totalMax).toBe(100);
    expect(result?.percentage).toBe(90);
    expect(result?.grade?.grade_name).toBe("A+");
    expect(result?.isPass).toBe(true);
  });

  it("treats a missing practical score as zero, not as ungraded", () => {
    const result = computeGrade(
      { theory: 40, practical: null, maxTheory: 80, maxPractical: 20, passMarks: 33 },
      scales,
    );
    expect(result?.totalMarks).toBe(40);
    expect(result?.percentage).toBe(40);
  });

  it("flags a below-pass-mark result even if it technically lands in a grade band", () => {
    const result = computeGrade(
      { theory: 20, practical: null, maxTheory: 80, maxPractical: 0, passMarks: 33 },
      scales,
    );
    expect(result?.isPass).toBe(false);
    expect(result?.grade?.grade_name).toBe("F");
  });
});
