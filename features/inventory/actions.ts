"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  inventoryCategorySchema,
  inventoryItemSchema,
  stockMovementSchema,
  type InventoryCategoryInput,
  type InventoryItemInput,
  type StockMovementInput,
} from "@/validations/inventory";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createCategoryAction(input: InventoryCategoryInput): Promise<ActionResult> {
  try {
    await requirePermission("inventory.manage");
    const parsed = inventoryCategorySchema.parse(input);
    const supabase = await createClient();
    await service.createCategory(supabase, parsed.name);
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create category.");
  }
}

export async function createItemAction(input: InventoryItemInput): Promise<ActionResult> {
  try {
    await requirePermission("inventory.manage");
    const parsed = inventoryItemSchema.parse(input);
    const supabase = await createClient();
    await service.createItem(supabase, parsed);
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create item.");
  }
}

export async function recordMovementAction(input: StockMovementInput): Promise<ActionResult> {
  try {
    await requirePermission("inventory.record_movement");
    const parsed = stockMovementSchema.parse(input);
    const supabase = await createClient();
    await service.recordMovement(supabase, parsed);
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not record movement.");
  }
}
