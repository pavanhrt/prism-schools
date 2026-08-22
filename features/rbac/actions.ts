"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

const assignRoleSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  roleId: z.string().uuid("Choose a role"),
});

export async function assignRoleAction(
  input: z.infer<typeof assignRoleSchema>,
): Promise<ActionResult> {
  try {
    await requirePermission("roles.manage");
    const { email, roleId } = assignRoleSchema.parse(input);
    const supabase = await createClient();
    await service.assignRoleByEmail(supabase, email, roleId);
    revalidatePath("/admin/settings/roles");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not assign role.");
  }
}

export async function revokeRoleAction(
  userId: string,
  roleId: string,
): Promise<ActionResult> {
  try {
    await requirePermission("roles.manage");
    const supabase = await createClient();
    await service.revokeRole(supabase, userId, roleId);
    revalidatePath("/admin/settings/roles");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not revoke role.");
  }
}
