import { describe, expect, it } from "vitest";
import { decideParentLoginAction, isPortalAccessActive } from "@/features/students/rules";

describe("decideParentLoginAction", () => {
  it("Case 1 — already linked guardian is a no-op, checked before anything else", () => {
    expect(
      decideParentLoginAction({ guardianUserId: "user-1", guardianEmail: "parent@example.com", existingAuthUserId: "user-1" }),
    ).toEqual({ action: "already_linked" });
    // Even a mismatched existingAuthUserId lookup must never override an
    // already-linked guardian's own user_id.
    expect(
      decideParentLoginAction({ guardianUserId: "user-1", guardianEmail: "parent@example.com", existingAuthUserId: "someone-else" }),
    ).toEqual({ action: "already_linked" });
  });

  it("Case 4 — missing email is a clean validation error, no Auth call attempted", () => {
    expect(decideParentLoginAction({ guardianUserId: null, guardianEmail: null, existingAuthUserId: null })).toEqual({
      action: "error",
      reason: "missing_email",
    });
    expect(decideParentLoginAction({ guardianUserId: null, guardianEmail: "   ", existingAuthUserId: null })).toEqual({
      action: "error",
      reason: "missing_email",
    });
  });

  it("Case 5 — invalid email is rejected before calling Auth", () => {
    expect(decideParentLoginAction({ guardianUserId: null, guardianEmail: "not-an-email", existingAuthUserId: null })).toEqual({
      action: "error",
      reason: "invalid_email",
    });
  });

  it("Case 2/3 — an existing auth account for this email is reused, never duplicated", () => {
    expect(
      decideParentLoginAction({ guardianUserId: null, guardianEmail: "ravi@example.com", existingAuthUserId: "user-99" }),
    ).toEqual({ action: "reuse_auth_user", userId: "user-99" });
  });

  it("no existing account and a valid email — create a new one", () => {
    expect(
      decideParentLoginAction({ guardianUserId: null, guardianEmail: "new.parent@example.com", existingAuthUserId: null }),
    ).toEqual({ action: "create_auth_user" });
  });
});

describe("isPortalAccessActive", () => {
  const now = new Date("2026-08-26T00:00:00Z");

  it("is active when never banned", () => {
    expect(isPortalAccessActive(null, now)).toBe(true);
  });

  it("is disabled when the ban is in the future", () => {
    expect(isPortalAccessActive("2126-01-01T00:00:00Z", now)).toBe(false);
  });

  it("is active again once a past ban has expired", () => {
    expect(isPortalAccessActive("2020-01-01T00:00:00Z", now)).toBe(true);
  });
});
