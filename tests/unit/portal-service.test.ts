import { describe, expect, it } from "vitest";
import { pickActiveStudent } from "@/features/portal/service";
import type { Student } from "@/types/students";

const students = [
  { id: "s1", first_name: "Asha" } as Student,
  { id: "s2", first_name: "Ravi" } as Student,
];

describe("pickActiveStudent", () => {
  it("picks the requested student when it's one of the caller's own", () => {
    expect(pickActiveStudent(students, "s2")?.id).toBe("s2");
  });

  it("falls back to the first student when no id is requested", () => {
    expect(pickActiveStudent(students)?.id).toBe("s1");
  });

  it("falls back to the first student when the requested id isn't one of the caller's own", () => {
    expect(pickActiveStudent(students, "someone-elses-child")?.id).toBe("s1");
  });

  it("returns null when the caller has no linked students at all", () => {
    expect(pickActiveStudent([])).toBeNull();
  });
});
