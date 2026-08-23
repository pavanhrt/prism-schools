import { describe, expect, it } from "vitest";
import { detectImageType, isManagedPath, managedPathFromPublicUrl, PRIVATE_SIGNED_URL_TTL_SECONDS } from "@/features/media/service";
import { PRIVATE_MEDIA_BUCKET, PUBLIC_MEDIA_BUCKET } from "@/types/media";

describe("media service security", () => {
  it("checks file signatures", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff]))?.mime).toBe("image/jpeg");
    expect(detectImageType(new TextEncoder().encode("<svg><script>"))).toBeNull();
  });
  it("accepts only controlled generated paths", () => {
    const id = "9ae33062-11f2-41d2-89fa-d48cbe309702";
    expect(isManagedPath(PUBLIC_MEDIA_BUCKET, `gallery/${id}.webp`)).toBe(true);
    expect(isManagedPath(PRIVATE_MEDIA_BUCKET, `students/${id}/photos/${id}.jpg`)).toBe(true);
    expect(isManagedPath(PRIVATE_MEDIA_BUCKET, `students/${id}/../../secret.pdf`)).toBe(false);
  });
  it("uses short-lived private URLs", () => expect(PRIVATE_SIGNED_URL_TTL_SECONDS).toBe(300));
  it("only extracts cleanup paths from the managed public bucket", () => {
    const id = "9ae33062-11f2-41d2-89fa-d48cbe309702";
    expect(managedPathFromPublicUrl(`https://project.supabase.co/storage/v1/object/public/public-school-media/hero/${id}.webp`)).toBe(`hero/${id}.webp`);
    expect(managedPathFromPublicUrl(`https://project.supabase.co/storage/v1/object/public/other-bucket/hero/${id}.webp`)).toBeNull();
  });
});
