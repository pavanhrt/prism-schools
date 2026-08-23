import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPrivateSignedUrl,
  isManagedPath,
  managedPathFromPublicUrl,
  PRIVATE_SIGNED_URL_TTL_SECONDS,
} from "@/features/media/service";
import * as repository from "@/features/media/repository";
import { PRIVATE_MEDIA_BUCKET, PUBLIC_MEDIA_BUCKET } from "@/types/media";

const entityId = "9ae33062-11f2-41d2-89fa-d48cbe309702";
const objectId = "5809d46e-2aae-42ad-b753-3898f9fd592c";

describe("public/private media boundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("never treats a private photo as managed public media", () => {
    const privatePath = `students/${entityId}/photos/${objectId}.webp`;
    expect(isManagedPath(PRIVATE_MEDIA_BUCKET, privatePath)).toBe(true);
    expect(isManagedPath(PUBLIC_MEDIA_BUCKET, privatePath)).toBe(false);
    expect(managedPathFromPublicUrl(`https://project.supabase.co/storage/v1/object/public/${PRIVATE_MEDIA_BUCKET}/${privatePath}`)).toBeNull();
  });

  it("never treats public website media as a managed private photo", () => {
    const publicPaths = [
      `branding/logo/${objectId}.png`,
      `hero/${objectId}.avif`,
      `programs/${entityId}/${objectId}.jpg`,
      `services/${entityId}/${objectId}.webp`,
      `gallery/${objectId}.webp`,
    ];
    for (const path of publicPaths) {
      expect(isManagedPath(PUBLIC_MEDIA_BUCKET, path)).toBe(true);
      expect(isManagedPath(PRIVATE_MEDIA_BUCKET, path)).toBe(false);
    }
  });

  it("creates private signed URLs only from the private bucket with the fixed short TTL", async () => {
    const path = `staff/${entityId}/photos/${objectId}.jpg`;
    const createSignedUrl = vi.spyOn(repository, "createSignedUrl").mockResolvedValue("https://project.supabase.co/storage/v1/object/sign/private-school-files/token");
    await expect(getPrivateSignedUrl({} as SupabaseClient, path)).resolves.toContain("/object/sign/private-school-files/");
    expect(createSignedUrl).toHaveBeenCalledWith(expect.anything(), PRIVATE_MEDIA_BUCKET, path, PRIVATE_SIGNED_URL_TTL_SECONDS);
  });

  it("rejects public, traversal, and non-photo paths before requesting a signed URL", async () => {
    const createSignedUrl = vi.spyOn(repository, "createSignedUrl");
    const invalidPaths = [
      `gallery/${objectId}.webp`,
      `students/${entityId}/../staff/${objectId}.jpg`,
      `students/${entityId}/documents/${objectId}.pdf`,
      `staff/${entityId}/photos/${objectId}.svg`,
    ];
    for (const path of invalidPaths) await expect(getPrivateSignedUrl({} as SupabaseClient, path)).rejects.toThrow("Invalid private media path");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
