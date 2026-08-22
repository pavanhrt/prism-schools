import type { StockMovement } from "@/types/inventory";

/** quantity_on_hand is never stored — see 0029_inventory.sql. This is the
 * one place the sum is computed, so every screen agrees on the number. */
export function computeStockLevel(itemId: string, movements: StockMovement[]): number {
  return movements
    .filter((m) => m.item_id === itemId)
    .reduce((total, m) => total + (m.movement_type === "in" ? m.quantity : -m.quantity), 0);
}
