import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permission, Profile, Role } from "@/types/rbac";

export async function listRoles(supabase: SupabaseClient): Promise<Role[]> {
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function listPermissions(
  supabase: SupabaseClient,
): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("module")
    .order("key");
  if (error) throw error;
  return data;
}

export async function listPermissionsForRole(
  supabase: SupabaseClient,
  roleId: string,
): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permissions(*)")
    .eq("role_id", roleId);
  if (error) throw error;
  return data
    .map((row) => row.permissions as unknown as Permission | null)
    .filter((p): p is Permission => Boolean(p));
}

/** Profile + assigned role keys, for the user-management table. */
export async function listUsersWithRoles(supabase: SupabaseClient) {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;

  const { data: userRoles, error: urError } = await supabase
    .from("user_roles")
    .select("user_id, roles(key, name)");
  if (urError) throw urError;

  const rolesByUser = new Map<string, { key: string; name: string }[]>();
  for (const row of userRoles) {
    const role = row.roles as unknown as { key: string; name: string } | null;
    if (!role) continue;
    const existing = rolesByUser.get(row.user_id) ?? [];
    existing.push(role);
    rolesByUser.set(row.user_id, existing);
  }

  return (profiles as Profile[]).map((profile) => ({
    profile,
    roles: rolesByUser.get(profile.id) ?? [],
  }));
}

export async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  // profiles has no email column (that lives on auth.users, which client
  // code can't query directly) — resolution happens via an admin-only RPC
  // in Phase 1's assign-by-email flow; see features/rbac/actions.ts.
  const { data, error } = await supabase.rpc("find_user_id_by_email", {
    lookup_email: email,
  });
  if (error) throw error;
  return data ?? null;
}

export async function assignRole(
  supabase: SupabaseClient,
  userId: string,
  roleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleId });
  if (error) throw error;
}

export async function revokeRole(
  supabase: SupabaseClient,
  userId: string,
  roleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId);
  if (error) throw error;
}
