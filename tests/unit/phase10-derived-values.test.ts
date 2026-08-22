import { describe, expect, it } from "vitest";
import { computeRoomOccupancy } from "@/features/hostel/service";
import { computeStockLevel } from "@/features/inventory/stock";
import type { StockMovement } from "@/types/inventory";

describe("computeRoomOccupancy", () => {
  const allocations = [
    { room_id: "room-1", status: "active" },
    { room_id: "room-1", status: "active" },
    { room_id: "room-1", status: "vacated" },
    { room_id: "room-2", status: "active" },
  ];

  it("counts only active allocations for the given room", () => {
    expect(computeRoomOccupancy("room-1", allocations)).toBe(2);
  });

  it("ignores vacated allocations", () => {
    expect(computeRoomOccupancy("room-2", allocations)).toBe(1);
  });

  it("returns 0 for a room with no allocations", () => {
    expect(computeRoomOccupancy("room-3", allocations)).toBe(0);
  });
});

describe("computeStockLevel", () => {
  function movement(overrides: Partial<StockMovement>): StockMovement {
    return {
      id: "m1",
      item_id: "item-1",
      movement_type: "in",
      quantity: 0,
      reason: null,
      movement_date: "2026-01-01",
      created_at: "",
      created_by: null,
      ...overrides,
    };
  }

  it("sums ins and subtracts outs for the given item only", () => {
    const movements = [
      movement({ movement_type: "in", quantity: 50 }),
      movement({ movement_type: "out", quantity: 20 }),
      movement({ movement_type: "in", quantity: 10, item_id: "item-2" }),
    ];
    expect(computeStockLevel("item-1", movements)).toBe(30);
  });

  it("returns 0 for an item with no movements", () => {
    expect(computeStockLevel("item-9", [])).toBe(0);
  });
});
