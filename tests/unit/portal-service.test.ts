import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPortalStudents, pickActiveStudent } from "@/features/portal/service";
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

// getPortalStudents must support Create Parent Login's "reuse_auth_user"
// case (features/students/rules.ts): one auth user can own multiple
// separate guardians rows, one per sibling, so this can never assume a
// single guardian row per user.
function makeMultiGuardianSupabaseMock(params: {
  guardianRows: { id: string }[];
  links: { student_id: string }[];
  students: Student[];
}) {
  const studentIdsQueried: string[] = [];

  const from = vi.fn((table: string) => {
    if (table === "students") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }), // not a student login
          }),
          in: (_col: string, ids: string[]) => {
            studentIdsQueried.push(...ids);
            return Promise.resolve({
              data: params.students.filter((s) => ids.includes(s.id)),
              error: null,
            });
          },
        }),
      };
    }
    if (table === "guardians") {
      return {
        select: () => ({
          eq: async () => ({ data: params.guardianRows, error: null }),
        }),
      };
    }
    if (table === "student_guardians") {
      return {
        select: () => ({
          in: async () => ({ data: params.links, error: null }),
        }),
      };
    }
    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { supabase: { from } as unknown as SupabaseClient, studentIdsQueried };
}

describe("getPortalStudents — one auth user, multiple guardian rows", () => {
  const studentA = { id: "student-a", first_name: "Rahul" } as Student;
  const studentC = { id: "student-c", first_name: "Priya" } as Student;
  const studentB = { id: "student-b", first_name: "Unrelated" } as Student;

  it("returns both siblings when two guardian rows share the same auth user", async () => {
    const { supabase } = makeMultiGuardianSupabaseMock({
      guardianRows: [{ id: "guardian-1" }, { id: "guardian-2" }],
      links: [{ student_id: "student-a" }, { student_id: "student-c" }],
      students: [studentA, studentB, studentC],
    });

    const result = await getPortalStudents(supabase, "parent-a-user-id");
    expect(result.map((s) => s.id).sort()).toEqual(["student-a", "student-c"]);
  });

  it("never includes a student not linked through any of the caller's own guardian rows", async () => {
    const { supabase } = makeMultiGuardianSupabaseMock({
      guardianRows: [{ id: "guardian-1" }],
      links: [{ student_id: "student-a" }],
      students: [studentA, studentB],
    });

    const result = await getPortalStudents(supabase, "parent-a-user-id");
    expect(result.map((s) => s.id)).toEqual(["student-a"]);
    expect(result.find((s) => s.id === "student-b")).toBeUndefined();
  });

  it("deduplicates a student linked through more than one of the caller's guardian rows", async () => {
    const { supabase, studentIdsQueried } = makeMultiGuardianSupabaseMock({
      guardianRows: [{ id: "guardian-1" }, { id: "guardian-2" }],
      links: [{ student_id: "student-a" }, { student_id: "student-a" }],
      students: [studentA],
    });

    const result = await getPortalStudents(supabase, "parent-a-user-id");
    expect(result.map((s) => s.id)).toEqual(["student-a"]);
    expect(studentIdsQueried).toEqual(["student-a"]);
  });

  it("returns an empty list when the caller has no guardian rows at all", async () => {
    const { supabase } = makeMultiGuardianSupabaseMock({ guardianRows: [], links: [], students: [] });
    const result = await getPortalStudents(supabase, "stranger-user-id");
    expect(result).toEqual([]);
  });
});
