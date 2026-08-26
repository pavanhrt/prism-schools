/**
 * Pure decision logic for the "Create Parent Login" admin flow — no DB or
 * Auth calls here, so every Case 1-5 branch from the spec is unit-testable
 * without mocking Supabase. The caller (features/students/actions.ts)
 * resolves the inputs (does the guardian already have a login? does an
 * auth.users account already exist for this email?) and then just executes
 * whichever action this function decides.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParentLoginDecision =
  | { action: "already_linked" }
  | { action: "error"; reason: "missing_email" | "invalid_email" }
  | { action: "reuse_auth_user"; userId: string }
  | { action: "create_auth_user" };

export function decideParentLoginAction(params: {
  guardianUserId: string | null;
  guardianEmail: string | null;
  existingAuthUserId: string | null;
}): ParentLoginDecision {
  const { guardianUserId, guardianEmail, existingAuthUserId } = params;

  // Case 1 — already linked. Checked first and unconditionally: even if
  // the caller also found a matching auth account by email, a guardian
  // that already has a login must never be re-pointed at a different one.
  if (guardianUserId) return { action: "already_linked" };

  // Case 4/5 — clean validation errors before ever touching Auth.
  if (!guardianEmail || !guardianEmail.trim()) return { action: "error", reason: "missing_email" };
  if (!EMAIL_RE.test(guardianEmail.trim())) return { action: "error", reason: "invalid_email" };

  // Case 2/3 — an auth.users account for this email already exists
  // (whether from a sibling's guardian record or a prior manual link):
  // reuse it, never create a second account for the same person.
  if (existingAuthUserId) return { action: "reuse_auth_user", userId: existingAuthUserId };

  return { action: "create_auth_user" };
}

/** Supabase Auth represents "not banned" as banned_until being null OR a
 * timestamp already in the past (a ban that has since expired). */
export function isPortalAccessActive(bannedUntil: string | null, now: Date = new Date()): boolean {
  if (!bannedUntil) return true;
  return new Date(bannedUntil).getTime() <= now.getTime();
}
