export interface InventoryCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface InventoryItem {
  id: string;
  category_id: string;
  name: string;
  unit: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type StockMovementType = "in" | "out";

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reason: string | null;
  movement_date: string;
  created_at: string;
  created_by: string | null;
}
