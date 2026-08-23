import { describe, expect, it } from "vitest";
import { normalizedMove } from "@/features/settings/service";

const item = (id: string, display_order: number) => ({ id, display_order });

describe("normalizedMove", () => {
  it("keeps the first item first when moving up and normalizes positions", () => {
    expect(normalizedMove([item("a", 5), item("b", 9)], "a", "up")).toEqual([item("a", 0), item("b", 1)]);
  });
  it("keeps the last item last when moving down", () => {
    expect(normalizedMove([item("a", 0), item("b", 1)], "b", "down")).toEqual([item("a", 0), item("b", 1)]);
  });
  it("is a stable normalized no-op for an unknown record", () => {
    expect(normalizedMove([item("a", 4), item("b", 4)], "missing", "up")).toEqual([item("a", 0), item("b", 1)]);
  });
  it("preserves input order for ties before moving", () => {
    expect(normalizedMove([item("b", 3), item("a", 3), item("c", 8)], "a", "down")).toEqual([item("b", 0), item("c", 1), item("a", 2)]);
  });
});
