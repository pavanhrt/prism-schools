import { z } from "zod";

export const inventoryCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
});

export const inventoryItemSchema = z.object({
  category_id: z.string().uuid("Choose a category"),
  name: z.string().trim().min(1, "Item name is required").max(150),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  reorder_level: z.coerce.number().int().min(0),
});

export const stockMovementSchema = z.object({
  item_id: z.string().uuid("Choose an item"),
  movement_type: z.enum(["in", "out"]),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export type InventoryCategoryInput = z.infer<typeof inventoryCategorySchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
