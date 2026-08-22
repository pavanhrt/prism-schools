import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The single place every feature module should ask "can this user do X".
 * Backed by the `has_permission` Postgres function, which is also what RLS
 * policies call — so a Server Action check and the database's own
 * enforcement can never disagree.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    permission_key: permissionKey,
  });
  if (error) {
    console.error(`has_permission("${permissionKey}") failed:`, error.message);
    return false;
  }
  return Boolean(data);
}

/** Throws if the current user lacks the permission — call at the top of a
 * Server Action or Route Handler before touching any data. */
export async function requirePermission(permissionKey: string): Promise<void> {
  if (!(await hasPermission(permissionKey))) {
    throw new Error(`Forbidden: missing permission "${permissionKey}"`);
  }
}

export async function getCurrentRoles(): Promise<string[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(key)")
    .eq("user_id", user.id);

  if (error || !data) return [];
  return data
    .map((row) => (row.roles as unknown as { key: string } | null)?.key)
    .filter((key): key is string => Boolean(key));
}
