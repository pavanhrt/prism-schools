"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  allocateHostelSchema,
  hostelRoomSchema,
  hostelSchema,
  type AllocateHostelInput,
  type HostelInput,
  type HostelRoomInput,
} from "@/validations/hostel";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createHostelAction(input: HostelInput): Promise<ActionResult> {
  try {
    await requirePermission("hostel.manage");
    const parsed = hostelSchema.parse(input);
    const supabase = await createClient();
    await service.createHostel(supabase, parsed);
    revalidatePath("/admin/hostel");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create hostel.");
  }
}

export async function createRoomAction(input: HostelRoomInput): Promise<ActionResult> {
  try {
    await requirePermission("hostel.manage");
    const parsed = hostelRoomSchema.parse(input);
    const supabase = await createClient();
    await service.createRoom(supabase, parsed);
    revalidatePath("/admin/hostel");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create room.");
  }
}

export async function allocateStudentAction(input: AllocateHostelInput): Promise<ActionResult> {
  try {
    await requirePermission("hostel.manage");
    const parsed = allocateHostelSchema.parse(input);
    const supabase = await createClient();
    await service.allocateStudent(supabase, parsed.room_id, parsed.student_id);
    revalidatePath("/admin/hostel");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not allocate — this student may already have an active bed.");
  }
}

export async function vacateAllocationAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("hostel.manage");
    const supabase = await createClient();
    await service.vacateAllocation(supabase, id);
    revalidatePath("/admin/hostel");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not vacate.");
  }
}
