import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// admitApplication is the one action in this phase that creates a
// permanent, hard-to-undo record. These pin down its three guard clauses
// so a status check can never be silently skipped.

vi.mock("@/features/admissions/repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admissions/repository")>();
  return {
    ...actual,
    getApplication: vi.fn(),
    markApplicationAdmitted: vi.fn(),
  };
});

vi.mock("@/features/students/service", () => ({
  admitNewStudent: vi.fn(),
}));

import { admitApplication } from "@/features/admissions/service";
import * as repo from "@/features/admissions/repository";
import * as studentsService from "@/features/students/service";

const supabase = {} as SupabaseClient;

describe("admitApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws if the application does not exist", async () => {
    vi.mocked(repo.getApplication).mockResolvedValue(null);

    await expect(
      admitApplication(supabase, "app-1", { section_id: "s1", roll_no: null }),
    ).rejects.toThrow(/not found/i);
  });

  it("throws if the application is not approved", async () => {
    vi.mocked(repo.getApplication).mockResolvedValue({
      id: "app-1",
      status: "submitted",
      student_id: null,
    } as never);

    await expect(
      admitApplication(supabase, "app-1", { section_id: "s1", roll_no: null }),
    ).rejects.toThrow(/approved/i);
    expect(studentsService.admitNewStudent).not.toHaveBeenCalled();
  });

  it("throws if the application was already admitted", async () => {
    vi.mocked(repo.getApplication).mockResolvedValue({
      id: "app-1",
      status: "approved",
      student_id: "existing-student",
    } as never);

    await expect(
      admitApplication(supabase, "app-1", { section_id: "s1", roll_no: null }),
    ).rejects.toThrow(/already been admitted/i);
    expect(studentsService.admitNewStudent).not.toHaveBeenCalled();
  });

  it("admits an approved, not-yet-admitted application exactly once", async () => {
    vi.mocked(repo.getApplication).mockResolvedValue({
      id: "app-1",
      status: "approved",
      student_id: null,
      first_name: "Asha",
      last_name: "Rao",
      dob: "2015-06-01",
      gender: "female",
      blood_group: null,
      email: null,
      phone: "9999999999",
      father_name: null,
      mother_name: null,
      guardian_phone: null,
      address: null,
      previous_school: null,
      class_applying_id: "class-1",
      academic_year_id: "year-1",
    } as never);
    vi.mocked(studentsService.admitNewStudent).mockResolvedValue({
      student: { id: "new-student-1" },
      enrollment: { id: "enrollment-1" },
    } as never);

    await admitApplication(supabase, "app-1", { section_id: "section-1", roll_no: "5" });

    expect(studentsService.admitNewStudent).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ first_name: "Asha", last_name: "Rao" }),
      { academic_year_id: "year-1", class_id: "class-1", section_id: "section-1", roll_no: "5" },
    );
    expect(repo.markApplicationAdmitted).toHaveBeenCalledWith(supabase, "app-1", "new-student-1");
  });
});
