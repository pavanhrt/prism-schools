import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAlertSummary } from "@/features/management-intelligence/repository";

function countClient(counts: number[]) {
  const calls: Array<[string, ...unknown[]]> = [];
  let queryIndex = 0;
  const supabase = {
    from(table: string) {
      const result = { data: null, error: null, count: counts[queryIndex++] };
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "in", "eq", "gte", "lte"]) {
        builder[method] = (...args: unknown[]) => {
          calls.push([method, ...args]);
          return builder;
        };
      }
      builder.then = (resolve: (value: typeof result) => unknown) => resolve(result);
      calls.push(["from", table]);
      return builder;
    },
  };
  return { supabase: supabase as unknown as SupabaseClient, calls };
}

describe("database-side management alert aggregation", () => {
  it("returns exact counts independently of any paginated alert rows", async () => {
    const { supabase, calls } = countClient([137, 509, 1003]);
    await expect(getAlertSummary(supabase, "2026-08-01", "2026-08-24")).resolves.toEqual({
      openCritical: 137,
      openWarnings: 509,
      resolvedThisPeriod: 1003,
    });
    expect(calls.filter(([method]) => method === "select")).toEqual([
      ["select", "id", { count: "exact", head: true }],
      ["select", "id", { count: "exact", head: true }],
      ["select", "id", { count: "exact", head: true }],
    ]);
    expect(calls).toContainEqual(["in", "status", ["OPEN", "ACKNOWLEDGED"]]);
    expect(calls).toContainEqual(["gte", "resolved_at", "2026-08-01T00:00:00.000Z"]);
    expect(calls).toContainEqual(["lte", "resolved_at", "2026-08-24T23:59:59.999Z"]);
  });
});
