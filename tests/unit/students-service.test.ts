import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admitNewStudent } from "@/features/students/service";

// The whole point of student_enrollments existing (blueprint §06) is that
// a student can never exist without a current enrollment row pointing at
// it. This pins down the two-insert ordering and the FK linkage between
// them, the same way Phase 1 pinned the is_current invariant.

function makeSupabaseMock() {
  const calls: string[] = [];
  const from = vi.fn((table: string) => ({
    insert: vi.fn((payload: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => {
          if (table === "students") {
            calls.push("insert:students");
            return { data: { id: "student-1", ...payload }, error: null };
          }
          calls.push(`insert:student_enrollments:student_id=${payload.student_id}`);
          return { data: { id: "enrollment-1", ...payload }, error: null };
        }),
      })),
    })),
  }));
  return { from, calls } as unknown as SupabaseClient & { calls: string[] };
}

describe("admitNewStudent", () => {
  it("creates the student before the enrollment, and links them", async () => {
    const supabase = makeSupabaseMock();

    const result = await admitNewStudent(
      supabase,
      {
        first_name: "Asha",
        last_name: "Rao",
        dob: "2015-06-01",
        gender: "female",
        blood_group: null,
        religion: null,
        email: null,
        phone: null,
        father_name: null,
        mother_name: null,
        guardian_phone: null,
        address: null,
        previous_school: null,
        photo_url: null,
      },
      { academic_year_id: "year-1", class_id: "class-1", section_id: "section-1", roll_no: "12" },
    );

    expect(supabase.calls).toEqual([
      "insert:students",
      "insert:student_enrollments:student_id=student-1",
    ]);
    expect(result.enrollment.student_id).toBe("student-1");
  });
});
