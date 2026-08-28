import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The one place login-time role routing happens — used by both
 * app/auth/login/actions.ts (server) and app/auth/reset-password/page.tsx
 * (browser client, after a successful password set). Backed by the
 * is_portal_user() SECURITY DEFINER function (0041 migration): a plain
 * `.from("user_roles").select("roles(portal_access)")` looks correct but
 * silently returns a null embedded "roles" object for anyone without
 * roles.view (RLS drops an embedded resource the caller can't read rather
 * than erroring), so portal_access always reads as false for a real
 * parent/student. The RPC answers "does auth.uid() have portal access"
 * directly, with no role data exposed either way.
 */
export async function resolvePortalRedirectPath(
  supabase: SupabaseClient,
): Promise<"/portal/dashboard" | "/admin/dashboard"> {
  const { data, error } = await supabase.rpc("is_portal_user");
  if (error) throw error;
  return data ? "/portal/dashboard" : "/admin/dashboard";
}
