import { describe, expect, it } from "vitest";
import { homeworkSchema, timetableSchema } from "@/validations/teaching";

describe("timetableSchema", () => {
  it("rejects an end time on or before the start time", () => {
    const result = timetableSchema.safeParse({
      academic_year_id: "123e4567-e89b-12d3-a456-426614174000",
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      section_id: "123e4567-e89b-12d3-a456-426614174000",
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      day_of_week: "monday",
      start_time: "10:00",
      end_time: "09:00",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("end_time");
    }
  });

  it("accepts a valid period", () => {
    const result = timetableSchema.safeParse({
      academic_year_id: "123e4567-e89b-12d3-a456-426614174000",
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      section_id: "123e4567-e89b-12d3-a456-426614174000",
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "09:45",
    });
    expect(result.success).toBe(true);
  });
});

describe("homeworkSchema", () => {
  it("rejects a due date before the assigned date", () => {
    const result = homeworkSchema.safeParse({
      academic_year_id: "123e4567-e89b-12d3-a456-426614174000",
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      section_id: "123e4567-e89b-12d3-a456-426614174000",
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      homework_date: "2026-01-10",
      submission_date: "2026-01-05",
      description: "Read chapter 4",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("submission_date");
    }
  });

  it("accepts a same-day due date", () => {
    const result = homeworkSchema.safeParse({
      academic_year_id: "123e4567-e89b-12d3-a456-426614174000",
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      section_id: "123e4567-e89b-12d3-a456-426614174000",
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      homework_date: "2026-01-10",
      submission_date: "2026-01-10",
      description: "In-class worksheet",
    });
    expect(result.success).toBe(true);
  });
});
