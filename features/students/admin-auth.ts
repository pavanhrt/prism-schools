import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPortalAccessActive } from "./rules";

/**
 * Every Supabase Auth Admin API call this feature needs, isolated in one
 * file so it's obvious at a glance which operations require the
 * service-role client. `import "server-only"` makes it a build error to
 * pull this into a Client Component bundle. Deliberately NOT imported by
 * features/students/service.ts — that file is imported by unit tests, and
 * "server-only" throws the moment a non-server runtime (Vitest included)
 * evaluates it. This mirrors app/auth/login/actions.ts, which calls
 * createAdminClient() directly for the same reason.
 */

/** An indefinite ban — GoTrue has no literal "forever", so this is the
 * documented convention (100 years). "none" un-bans. */
const INDEFINITE_BAN = "876000h";

/**
 * Finds or creates the Auth account for a guardian. When `existingUserId`
 * is null, this sends a Supabase-managed invitation email — the parent
 * sets their own password by following the link, so this app never
 * generates, stores, or sees a plaintext password.
 */
export async function findOrCreateParentAuthUser(params: {
  email: string;
  fullName: string;
  existingUserId: string | null;
  redirectTo: string;
}): Promise<string> {
  if (params.existingUserId) return params.existingUserId;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(params.email, {
    data: { full_name: params.fullName },
    redirectTo: params.redirectTo,
  });
  if (error) throw error;
  return data.user.id;
}

export async function sendParentPasswordReset(email: string, redirectTo: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function getPortalAccessStatus(userId: string): Promise<"active" | "disabled"> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw error;
  return isPortalAccessActive(data.user.banned_until ?? null) ? "active" : "disabled";
}

export async function setPortalAccessEnabled(userId: string, enabled: boolean): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: enabled ? "none" : INDEFINITE_BAN,
  });
  if (error) throw error;
}
