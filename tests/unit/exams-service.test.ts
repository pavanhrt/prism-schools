import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enterMarks } from "@/features/exams/service";

describe("enterMarks", () => {
  it("upserts on (exam_schedule_id, student_id) so re-entering corrects, not duplicates", async () => {
    let payload: unknown;
    let options: unknown;
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn((p: unknown, o: unknown) => {
          payload = p;
          options = o;
          return Promise.resolve({ error: null });
        }),
      })),
    } as unknown as SupabaseClient;

    await enterMarks(supabase, {
      exam_schedule_id: "schedule-1",
      entries: [
        { student_id: "s1", marks_theory: 72, marks_practical: 18, attendance_status: "present" },
        { student_id: "s2", marks_theory: null, marks_practical: null, attendance_status: "absent" },
      ],
    });

    expect(options).toEqual({ onConflict: "exam_schedule_id,student_id" });
    expect(payload).toEqual([
      { exam_schedule_id: "schedule-1", student_id: "s1", marks_theory: 72, marks_practical: 18, attendance_status: "present" },
      { exam_schedule_id: "schedule-1", student_id: "s2", marks_theory: null, marks_practical: null, attendance_status: "absent" },
    ]);
  });
});
