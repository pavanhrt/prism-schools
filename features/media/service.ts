import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import { PRIVATE_MEDIA_BUCKET, PUBLIC_MEDIA_BUCKET, type PublicMediaCategory, type StoredMedia, type WebsiteGalleryItem } from "@/types/media";
import type { GalleryItemInput, GalleryItemUpdateInput } from "@/validations/media";
import * as settingsRepository from "@/features/settings/repository";

export const PRIVATE_SIGNED_URL_TTL_SECONDS = 300;
const limits = { brand: 2 * 1024 * 1024, general: 8 * 1024 * 1024, privatePhoto: 5 * 1024 * 1024 } as const;
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const starts = (bytes: Uint8Array, values: number[]) => values.every((value, index) => bytes[index] === value);

export function detectImageType(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (starts(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: "jpg" };
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: "png" };
  if (text(bytes.slice(0, 4)) === "RIFF" && text(bytes.slice(8, 12)) === "WEBP") return { mime: "image/webp", extension: "webp" };
  if (text(bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(text(bytes.slice(8, 12)))) return { mime: "image/avif", extension: "avif" };
  if (starts(bytes, [0, 0, 1, 0])) return { mime: "image/x-icon", extension: "ico" };
  return null;
}

export async function validateImageFile(file: File, maxBytes: number, allowIcon = false) {
  if (!(file instanceof File) || !file.size) throw new Error("Choose a non-empty image file.");
  if (file.size > maxBytes) throw new Error(`Image exceeds the ${maxBytes / 1024 / 1024} MB limit.`);
  const buffer = await file.arrayBuffer();
  const detected = detectImageType(new Uint8Array(buffer.slice(0, 16)));
  if (!detected || (detected.mime === "image/x-icon" && !allowIcon)) throw new Error("Only JPEG, PNG, WebP, and AVIF images are allowed.");
  const iconAlias = detected.mime === "image/x-icon" && file.type === "image/vnd.microsoft.icon";
  if (file.type && file.type !== detected.mime && !iconAlias) throw new Error("File content does not match its declared image type.");
  return { buffer, ...detected };
}

function root(category: PublicMediaCategory, id?: string) {
  if ((category === "program" || category === "service") && !id) throw new Error("A record ID is required.");
  return ({ "branding-logo": "branding/logo", "branding-favicon": "branding/favicon", hero: "hero", "og-image": "branding/og", program: `programs/${id}`, service: `services/${id}`, gallery: "gallery" } as const)[category];
}

export function isManagedPath(bucket: string, path: string) {
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  if (bucket === PUBLIC_MEDIA_BUCKET) return /^(branding\/(logo|favicon|og)|hero|programs\/[0-9a-f-]+|services\/[0-9a-f-]+|gallery)\/[0-9a-f-]+\.(jpg|png|webp|avif|ico)$/.test(path);
  return bucket === PRIVATE_MEDIA_BUCKET && /^(students|staff)\/[0-9a-f-]+\/photos\/[0-9a-f-]+\.(jpg|png|webp|avif)$/.test(path);
}

export function managedPathFromPublicUrl(value: string | null): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/`;
  const index = value.indexOf(marker);
  if (index < 0) return null;
  const path = decodeURIComponent(value.slice(index + marker.length));
  return isManagedPath(PUBLIC_MEDIA_BUCKET, path) ? path : null;
}

export async function uploadPublicMedia(s: SupabaseClient, category: PublicMediaCategory, file: File, id?: string): Promise<StoredMedia> {
  const checked = await validateImageFile(file, category.startsWith("branding-") ? limits.brand : limits.general, category === "branding-favicon");
  const path = `${root(category, id)}/${crypto.randomUUID()}.${checked.extension}`;
  await repository.uploadObject(s, PUBLIC_MEDIA_BUCKET, path, checked.buffer, checked.mime);
  return { bucket: PUBLIC_MEDIA_BUCKET, path, url: repository.getPublicUrl(s, PUBLIC_MEDIA_BUCKET, path) };
}

async function uploadPrivatePhoto(s: SupabaseClient, domain: "students" | "staff", id: string, file: File) {
  const checked = await validateImageFile(file, limits.privatePhoto);
  const path = `${domain}/${id}/photos/${crypto.randomUUID()}.${checked.extension}`;
  await repository.uploadObject(s, PRIVATE_MEDIA_BUCKET, path, checked.buffer, checked.mime);
  return { bucket: PRIVATE_MEDIA_BUCKET, path, url: null } satisfies StoredMedia;
}
export const uploadStudentPhoto = (s: SupabaseClient, id: string, file: File) => uploadPrivatePhoto(s, "students", id, file);
export const uploadStaffPhoto = (s: SupabaseClient, id: string, file: File) => uploadPrivatePhoto(s, "staff", id, file);

export async function replacePublicReference(
  s: SupabaseClient,
  category: PublicMediaCategory,
  file: File,
  currentValue: string | null,
  persist: (url: string) => Promise<unknown>,
  id?: string,
): Promise<StoredMedia> {
  const media = await uploadPublicMedia(s, category, file, id);
  try { await persist(media.url!); }
  catch (error) { await repository.removeObject(s, media.bucket, media.path).catch(() => undefined); throw error; }
  const oldPath = managedPathFromPublicUrl(currentValue);
  if (oldPath && oldPath !== media.path) await repository.removeObject(s, PUBLIC_MEDIA_BUCKET, oldPath).catch(() => undefined);
  return media;
}

export async function replacePrivatePhoto(
  s: SupabaseClient,
  domain: "students" | "staff",
  id: string,
  file: File,
  currentPath: string | null,
  persist: (path: string) => Promise<unknown>,
): Promise<StoredMedia> {
  const media = await uploadPrivatePhoto(s, domain, id, file);
  try { await persist(media.path); }
  catch (error) { await repository.removeObject(s, media.bucket, media.path).catch(() => undefined); throw error; }
  if (currentPath && isManagedPath(PRIVATE_MEDIA_BUCKET, currentPath) && currentPath !== media.path) {
    await repository.removeObject(s, PRIVATE_MEDIA_BUCKET, currentPath).catch(() => undefined);
  }
  return media;
}
export async function getPrivateSignedUrl(s: SupabaseClient, path: string) {
  if (!isManagedPath(PRIVATE_MEDIA_BUCKET, path)) throw new Error("Invalid private media path.");
  return repository.createSignedUrl(s, PRIVATE_MEDIA_BUCKET, path, PRIVATE_SIGNED_URL_TTL_SECONDS);
}
export async function createGalleryItem(s: SupabaseClient, input: GalleryItemInput, file: File): Promise<WebsiteGalleryItem> {
  const media = await uploadPublicMedia(s, "gallery", file);
  try { return await settingsRepository.insertWebsiteGalleryItem(s, { ...input, caption: input.caption || null, category: input.category || null, storage_path: media.path, image_url: media.url! }); }
  catch (error) { await repository.removeObject(s, PUBLIC_MEDIA_BUCKET, media.path).catch(() => undefined); throw error; }
}
export const updateGalleryItem = (s: SupabaseClient, id: string, input: GalleryItemUpdateInput) => settingsRepository.updateWebsiteGalleryItem(s, id, input);
export async function deleteGalleryItem(s: SupabaseClient, id: string) {
  const item = (await settingsRepository.listWebsiteGalleryItems(s)).find((entry) => entry.id === id);
  if (!item) throw new Error("Gallery item not found.");
  await settingsRepository.deleteWebsiteGalleryItem(s, id);
  if (isManagedPath(PUBLIC_MEDIA_BUCKET, item.storage_path)) await repository.removeObject(s, PUBLIC_MEDIA_BUCKET, item.storage_path);
}
