import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePortalRedirectPath } from "@/lib/auth/routing";

function makeRpcMock(isPortalUser: boolean | null, error: Error | null = null) {
  const rpc = vi.fn(async () => ({ data: isPortalUser, error }));
  return { rpc } as unknown as SupabaseClient;
}

describe("resolvePortalRedirectPath", () => {
  // Backed by the is_portal_user() RPC (0041 migration) rather than a
  // direct user_roles/roles select — that select silently reads as "no
  // portal access" for any real parent/student, since the embedded roles
  // join requires roles.view, which portal roles don't hold.

  it("routes a parent (portal_access role) to /portal/dashboard", async () => {
    const supabase = makeRpcMock(true);
    expect(await resolvePortalRedirectPath(supabase)).toBe("/portal/dashboard");
  });

  it("routes a student (portal_access role) to /portal/dashboard", async () => {
    // is_portal_user() doesn't distinguish which portal_access role it is —
    // student and parent both resolve identically, which is exactly the point.
    const supabase = makeRpcMock(true);
    expect(await resolvePortalRedirectPath(supabase)).toBe("/portal/dashboard");
  });

  it("routes a super_admin (no portal_access role) to /admin/dashboard", async () => {
    const supabase = makeRpcMock(false);
    expect(await resolvePortalRedirectPath(supabase)).toBe("/admin/dashboard");
  });

  it("routes a school_admin (no portal_access role) to /admin/dashboard", async () => {
    const supabase = makeRpcMock(false);
    expect(await resolvePortalRedirectPath(supabase)).toBe("/admin/dashboard");
  });

  it("propagates an RPC error instead of silently defaulting a route", async () => {
    const supabase = makeRpcMock(null, new Error("network error"));
    await expect(resolvePortalRedirectPath(supabase)).rejects.toThrow("network error");
  });
});
