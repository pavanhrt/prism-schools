import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely — use only for the
 * handful of operations that must run outside a user's own permissions,
 * e.g. writing to `login_attempts` on a failed/unauthenticated login.
 *
 * `import "server-only"` makes it a build error to import this from
 * anything that could end up in a Client Component bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
