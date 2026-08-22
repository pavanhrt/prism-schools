import { describe, expect, it } from "vitest";
import {
  academicYearSchema,
  classSchema,
  sectionSchema,
  subjectSchema,
} from "@/validations/academic";

describe("academicYearSchema", () => {
  it("accepts a valid year", () => {
    const result = academicYearSchema.safeParse({
      year_label: "2026-27",
      start_date: "2026-04-01",
      end_date: "2027-03-31",
      is_current: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date on or before the start date", () => {
    const result = academicYearSchema.safeParse({
      year_label: "2026-27",
      start_date: "2026-04-01",
      end_date: "2026-01-01",
      is_current: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("end_date");
    }
  });
});

describe("classSchema", () => {
  it("rejects an empty class name", () => {
    const result = classSchema.safeParse({ name: "", sequence: 1 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid class", () => {
    const result = classSchema.safeParse({ name: "Class 5", sequence: 5 });
    expect(result.success).toBe(true);
  });
});

describe("sectionSchema", () => {
  it("requires a valid class_id uuid", () => {
    const result = sectionSchema.safeParse({
      class_id: "not-a-uuid",
      name: "A",
      capacity: 40,
    });
    expect(result.success).toBe(false);
  });
});

describe("subjectSchema", () => {
  it("accepts a theory subject", () => {
    const result = subjectSchema.safeParse({
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Mathematics",
      subject_type: "theory",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a subject_type outside the enum", () => {
    const result = subjectSchema.safeParse({
      class_id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Mathematics",
      subject_type: "lab",
    });
    expect(result.success).toBe(false);
  });
});
