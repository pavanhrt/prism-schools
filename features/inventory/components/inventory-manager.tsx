"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inventoryCategorySchema,
  inventoryItemSchema,
  stockMovementSchema,
  type InventoryCategoryInput,
  type InventoryItemInput,
  type StockMovementInput,
} from "@/validations/inventory";
import {
  createCategoryAction,
  createItemAction,
  recordMovementAction,
} from "@/features/inventory/actions";
import { computeStockLevel } from "@/features/inventory/stock";
import type { InventoryCategory, InventoryItem, StockMovement } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function InventoryManager({
  categories,
  items,
  movements,
  canManage,
  canRecord,
}: {
  categories: InventoryCategory[];
  items: InventoryItem[];
  movements: StockMovement[];
  canManage: boolean;
  canRecord: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  const categoryForm = useForm<InventoryCategoryInput>({ resolver: zodResolver(inventoryCategorySchema) });
  const itemForm = useForm<InventoryItemInput>({ resolver: zodResolver(inventoryItemSchema), defaultValues: { unit: "pcs", reorder_level: 0 } });
  const movementForm = useForm<StockMovementInput>({ resolver: zodResolver(stockMovementSchema), defaultValues: { movement_type: "in" } });

  async function onAddCategory(values: InventoryCategoryInput) {
    setError(null);
    const result = await createCategoryAction(values);
    if (!result.ok) { setError(result.error); return; }
    categoryForm.reset({ name: "" });
    router.refresh();
  }

  async function onAddItem(values: InventoryItemInput) {
    setError(null);
    const result = await createItemAction(values);
    if (!result.ok) { setError(result.error); return; }
    itemForm.reset({ category_id: values.category_id, name: "", unit: "pcs", reorder_level: 0 });
    router.refresh();
  }

  async function onRecordMovement(values: StockMovementInput) {
    setError(null);
    const result = await recordMovementAction(values);
    if (!result.ok) { setError(result.error); return; }
    movementForm.reset({ item_id: "", movement_type: "in", quantity: 1, reason: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card>
            <CardHeader><CardTitle>Add category</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={categoryForm.handleSubmit(onAddCategory)} className="flex items-end gap-2">
                <Input placeholder="Category" {...categoryForm.register("name")} />
                <Button type="submit" size="sm" disabled={categoryForm.formState.isSubmitting}>Add</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canManage && (
          <Card>
            <CardHeader><CardTitle>Add item</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={itemForm.handleSubmit(onAddItem)} className="flex flex-col gap-2">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...itemForm.register("category_id")}>
                  <option value="">Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input placeholder="Item name" {...itemForm.register("name")} />
                <div className="flex gap-2">
                  <Input placeholder="Unit" className="w-20" {...itemForm.register("unit")} />
                  <Input type="number" placeholder="Reorder at" {...itemForm.register("reorder_level")} />
                </div>
                <Button type="submit" size="sm" disabled={itemForm.formState.isSubmitting} className="self-start">Add</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canRecord && (
          <Card>
            <CardHeader><CardTitle>Record movement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={movementForm.handleSubmit(onRecordMovement)} className="flex flex-col gap-2">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...movementForm.register("item_id")}>
                  <option value="">Item</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...movementForm.register("movement_type")}>
                    <option value="in">In</option>
                    <option value="out">Out</option>
                  </select>
                  <Input type="number" placeholder="Qty" {...movementForm.register("quantity")} />
                </div>
                <Input placeholder="Reason (optional)" {...movementForm.register("reason")} />
                <Button type="submit" size="sm" disabled={movementForm.formState.isSubmitting} className="self-start">Record</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <THead><TR><TH>Item</TH><TH>Category</TH><TH className="text-right">On hand</TH><TH>Reorder at</TH></TR></THead>
        <TBody>
          {items.map((item) => {
            const stock = computeStockLevel(item.id, movements);
            return (
              <TR key={item.id}>
                <TD className="font-medium text-slate-900">{item.name}</TD>
                <TD>{categoryById.get(item.category_id) ?? "—"}</TD>
                <TD className="text-right">{stock} {item.unit}</TD>
                <TD>
                  {stock <= item.reorder_level ? <Badge variant="warning">low — reorder at {item.reorder_level}</Badge> : item.reorder_level}
                </TD>
              </TR>
            );
          })}
          {items.length === 0 && <TR><TD colSpan={4} className="py-6 text-center text-slate-400">No items yet.</TD></TR>}
        </TBody>
      </Table>
    </div>
  );
}
