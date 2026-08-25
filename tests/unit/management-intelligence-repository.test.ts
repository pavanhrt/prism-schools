import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { countActiveAlertsByStudent, getAlertSummary } from "@/features/management-intelligence/repository";

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

describe("phase 2b: grouped active-alert count per student, correct past 100 alerts", () => {
  it("uses a single grouped RPC call rather than fetching every alert row to count them", async () => {
    // 137 distinct students each with an active alert — more than
    // repository.listAlerts' pageSize-100 clamp, which is exactly the bug
    // this RPC-backed function exists to avoid.
    const grouped = Array.from({ length: 137 }, (_, i) => ({ student_id: `student-${i + 1}`, alert_count: 1 }));
    grouped.push({ student_id: "student-1", alert_count: 3 }); // duplicate entries are not expected from the SQL GROUP BY, but Map construction stays correct if seen
    let rpcCalls = 0;
    let rpcName = "";
    const supabase = {
      rpc: (name: string) => {
        rpcCalls += 1;
        rpcName = name;
        return Promise.resolve({ data: grouped, error: null });
      },
    } as unknown as SupabaseClient;

    const result = await countActiveAlertsByStudent(supabase);
    expect(rpcCalls).toBe(1);
    expect(rpcName).toBe("count_active_management_alerts_by_student");
    expect(result.size).toBe(137);
    expect(result.get("student-137")).toBe(1);
    // Map construction takes the last entry for a repeated key — proves the
    // caller never needs to manually re-aggregate rows itself.
    expect(result.get("student-1")).toBe(3);
  });
});
