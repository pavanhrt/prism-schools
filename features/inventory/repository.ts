import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryCategory, InventoryItem, StockMovement } from "@/types/inventory";

export async function listCategories(supabase: SupabaseClient): Promise<InventoryCategory[]> {
  const { data, error } = await supabase.from("inventory_categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertCategory(supabase: SupabaseClient, name: string): Promise<InventoryCategory> {
  const { data, error } = await supabase.from("inventory_categories").insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function listItems(supabase: SupabaseClient): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory_items").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertItem(
  supabase: SupabaseClient,
  input: Pick<InventoryItem, "category_id" | "name" | "unit" | "reorder_level">,
): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory_items").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listMovements(supabase: SupabaseClient): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("inventory_stock_movements")
    .select("*")
    .order("movement_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertMovement(
  supabase: SupabaseClient,
  input: Pick<StockMovement, "item_id" | "movement_type" | "quantity" | "reason">,
): Promise<StockMovement> {
  const { data, error } = await supabase.from("inventory_stock_movements").insert(input).select().single();
  if (error) throw error;
  return data;
}
