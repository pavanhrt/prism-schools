import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import { computeStockLevel } from "./stock";
import type { InventoryItemInput, StockMovementInput } from "@/validations/inventory";

export const listCategories = repo.listCategories;
export const listItems = repo.listItems;
export const listMovements = repo.listMovements;

export async function createCategory(supabase: SupabaseClient, name: string) {
  return repo.insertCategory(supabase, name);
}

export async function createItem(supabase: SupabaseClient, input: InventoryItemInput) {
  return repo.insertItem(supabase, input);
}

/** Blocks an "out" movement that would take stock negative. Not a DB
 * constraint (the running total isn't a column, it's a query — see
 * computeStockLevel), so this check is app-layer only; acceptable here
 * since inventory.record_movement is already a staff-only permission. */
export async function recordMovement(supabase: SupabaseClient, input: StockMovementInput) {
  if (input.movement_type === "out") {
    const movements = await repo.listMovements(supabase);
    const currentStock = computeStockLevel(input.item_id, movements);
    if (input.quantity > currentStock) {
      throw new Error(`Only ${currentStock} in stock — can't remove ${input.quantity}.`);
    }
  }
  return repo.insertMovement(supabase, {
    item_id: input.item_id,
    movement_type: input.movement_type,
    quantity: input.quantity,
    reason: input.reason || null,
  });
}
