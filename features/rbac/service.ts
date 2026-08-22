import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";

export async function assignRoleByEmail(
  supabase: SupabaseClient,
  email: string,
  roleId: string,
): Promise<void> {
  const userId = await repo.findUserIdByEmail(supabase, email);
  if (!userId) {
    throw new Error(`No user found for ${email}`);
  }
  await repo.assignRole(supabase, userId, roleId);
}

export const listRoles = repo.listRoles;
export const listPermissions = repo.listPermissions;
export const listPermissionsForRole = repo.listPermissionsForRole;
export const listUsersWithRoles = repo.listUsersWithRoles;
export const revokeRole = repo.revokeRole;
