import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { markAttendance } from "@/features/attendance/service";

// The whole reason markAttendance upserts on (student_id, attendance_date)
// instead of inserting is so re-submitting the same day corrects it rather
// than hitting the unique constraint from 0012_student_attendance.sql.

describe("markAttendance", () => {
  it("upserts one row per roster entry, stamped with the section context", async () => {
    let upsertPayload: unknown;
    let upsertOptions: unknown;
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn((payload: unknown, options: unknown) => {
          upsertPayload = payload;
          upsertOptions = options;
          return Promise.resolve({ error: null });
        }),
      })),
    } as unknown as SupabaseClient;

    await markAttendance(supabase, {
      academic_year_id: "year-1",
      class_id: "class-1",
      section_id: "section-1",
      attendance_date: "2026-06-15",
      entries: [
        { student_id: "s1", status: "present" },
        { student_id: "s2", status: "absent", note: "sick" },
      ],
    });

    expect(upsertOptions).toEqual({ onConflict: "student_id,attendance_date" });
    expect(upsertPayload).toEqual([
      {
        student_id: "s1",
        academic_year_id: "year-1",
        class_id: "class-1",
        section_id: "section-1",
        attendance_date: "2026-06-15",
        status: "present",
        note: null,
      },
      {
        student_id: "s2",
        academic_year_id: "year-1",
        class_id: "class-1",
        section_id: "section-1",
        attendance_date: "2026-06-15",
        status: "absent",
        note: "sick",
      },
    ]);
  });
});
