"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  allocateTransportSchema,
  transportRouteSchema,
  transportStopSchema,
  vehicleSchema,
  type AllocateTransportInput,
  type TransportRouteInput,
  type TransportStopInput,
  type VehicleInput,
} from "@/validations/transport";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createVehicleAction(input: VehicleInput): Promise<ActionResult> {
  try {
    await requirePermission("transport.manage");
    const parsed = vehicleSchema.parse(input);
    const supabase = await createClient();
    await service.createVehicle(supabase, parsed);
    revalidatePath("/admin/transport");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add vehicle.");
  }
}

export async function createRouteAction(input: TransportRouteInput): Promise<ActionResult> {
  try {
    await requirePermission("transport.manage");
    const parsed = transportRouteSchema.parse(input);
    const supabase = await createClient();
    await service.createRoute(supabase, parsed);
    revalidatePath("/admin/transport");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add route.");
  }
}

export async function createStopAction(input: TransportStopInput): Promise<ActionResult> {
  try {
    await requirePermission("transport.manage");
    const parsed = transportStopSchema.parse(input);
    const supabase = await createClient();
    await service.createStop(supabase, parsed);
    revalidatePath("/admin/transport");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add stop.");
  }
}

export async function allocateTransportAction(input: AllocateTransportInput): Promise<ActionResult> {
  try {
    await requirePermission("transport.manage");
    const parsed = allocateTransportSchema.parse(input);
    const supabase = await createClient();
    await service.allocateStudent(supabase, parsed);
    revalidatePath("/admin/transport");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not allocate transport — this student may already have an allocation for this year.");
  }
}
