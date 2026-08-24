import { afterEach, describe, expect, it } from "vitest";
import { shouldBypassLogoOptimization } from "@/components/school/school-logo";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  }
});

describe("shouldBypassLogoOptimization", () => {
  it("returns false for local URLs", () => {
    expect(shouldBypassLogoOptimization("/branding/prism-logo.png")).toBe(false);
  });

  it("returns false for exact managed public URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(
      shouldBypassLogoOptimization(
        "https://school.supabase.co/storage/v1/object/public/public-school-media/branding/logo.png",
      ),
    ).toBe(false);
  });

  it("returns true for external hosts", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(shouldBypassLogoOptimization("https://example.com/logo.png")).toBe(true);
  });

  it("returns true for HTTP URLs, including the configured host", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(
      shouldBypassLogoOptimization(
        "http://school.supabase.co/storage/v1/object/public/public-school-media/branding/logo.png",
      ),
    ).toBe(true);
  });

  it("returns true for another Supabase host", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(
      shouldBypassLogoOptimization(
        "https://other.supabase.co/storage/v1/object/public/public-school-media/branding/logo.png",
      ),
    ).toBe(true);
  });

  it("returns true for signed private paths", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(
      shouldBypassLogoOptimization(
        "https://school.supabase.co/storage/v1/object/sign/private-school-media/students/photo.png?token=secret",
      ),
    ).toBe(true);
  });

  it("returns true for a different public bucket path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://school.supabase.co";

    expect(
      shouldBypassLogoOptimization(
        "https://school.supabase.co/storage/v1/object/public/private-school-media/branding/logo.png",
      ),
    ).toBe(true);
  });

  it.each([undefined, "not-a-url", "http://school.supabase.co"])(
    "returns true when the Supabase configuration is invalid (%s)",
    (configuredUrl) => {
      if (configuredUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = configuredUrl;
      }

      expect(
        shouldBypassLogoOptimization(
          "https://school.supabase.co/storage/v1/object/public/public-school-media/branding/logo.png",
        ),
      ).toBe(true);
    },
  );
});
