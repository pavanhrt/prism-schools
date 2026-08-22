import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setCurrentAcademicYear, nextClassSequence } from "@/features/academics/service";

// These two invariants are the actual fix for the legacy schema's gaps
// (blueprint §06): "only one current academic year" and "sequence is
// derived, not hand-typed". Both are cheap to get wrong silently, so they
// get real tests rather than just relying on the DB constraint.

function makeCurrentYearMock() {
  const calls: string[] = [];
  const from = vi.fn(() => ({
    update: vi.fn((payload: { is_current: boolean }) => ({
      eq: vi.fn(async (column: string, value: unknown) => {
        calls.push(`${column}=${String(value)} -> is_current:${payload.is_current}`);
        return { error: null };
      }),
    })),
  }));
  return { from, calls } as unknown as SupabaseClient & { calls: string[] };
}

describe("setCurrentAcademicYear", () => {
  it("clears the existing current year before marking the new one", async () => {
    const supabase = makeCurrentYearMock();
    await setCurrentAcademicYear(supabase, "year-2");

    // Order matters: if these ran in the other order, or as one statement,
    // the partial unique index on is_current would either reject the write
    // or briefly allow two "current" years.
    expect(supabase.calls).toEqual([
      "is_current=true -> is_current:false",
      "id=year-2 -> is_current:true",
    ]);
  });
});

describe("nextClassSequence", () => {
  it("returns one past the highest existing sequence", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { sequence: 4 },
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    await expect(nextClassSequence(supabase)).resolves.toBe(5);
  });

  it("starts at 0 when there are no classes yet", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    await expect(nextClassSequence(supabase)).resolves.toBe(0);
  });
});
