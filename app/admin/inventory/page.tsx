import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listCategories, listItems, listMovements } from "@/features/inventory/service";
import { InventoryManager } from "@/features/inventory/components/inventory-manager";

export default async function InventoryPage() {
  const supabase = await createClient();
  const [categories, items, movements, canManage, canRecord] = await Promise.all([
    listCategories(supabase),
    listItems(supabase),
    listMovements(supabase),
    hasPermission("inventory.manage"),
    hasPermission("inventory.record_movement"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
      </div>
      <InventoryManager categories={categories} items={items} movements={movements} canManage={canManage} canRecord={canRecord} />
    </div>
  );
}
