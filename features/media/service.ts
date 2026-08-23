import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import { PRIVATE_MEDIA_BUCKET, PUBLIC_MEDIA_BUCKET, type MediaCleanupResult, type PublicMediaAsset, type PublicMediaCategory, type PublicMediaLibrary, type PublicMediaUsage, type PublicMediaUsageKind, type StoredMedia, type WebsiteGalleryItem } from "@/types/media";
import type { GalleryItemInput, GalleryItemUpdateInput } from "@/validations/media";
import * as settingsRepository from "@/features/settings/repository";

export const PRIVATE_SIGNED_URL_TTL_SECONDS = 300;
export class PublicMediaCleanupError extends Error {}
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
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const image = "(?:jpg|png|webp|avif)";
  if (bucket === PUBLIC_MEDIA_BUCKET) {
    return new RegExp(`^(?:branding\/(?:logo|og)\/${uuid}\\.${image}|branding\/favicon\/${uuid}\\.(?:${image}|ico)|hero\/${uuid}\\.${image}|programs\/${uuid}\/${uuid}\\.${image}|services\/${uuid}\/${uuid}\\.${image}|gallery\/${uuid}\\.${image})$`).test(path);
  }
  return bucket === PRIVATE_MEDIA_BUCKET
    && new RegExp(`^(?:students|staff)\/${uuid}\/photos\/${uuid}\\.${image}$`).test(path);
}

export function managedPathFromPublicUrl(value: string | null): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/`;
  const index = value.indexOf(marker);
  if (index < 0) return null;
  const path = decodeURIComponent(value.slice(index + marker.length));
  return isManagedPath(PUBLIC_MEDIA_BUCKET, path) ? path : null;
}

export function canonicalManagedPathFromPublicUrl(s: SupabaseClient, value: string | null): string | null {
  if (!value) return null;
  const path = managedPathFromPublicUrl(value);
  if (!path) return null;
  return repository.getPublicUrl(s, PUBLIC_MEDIA_BUCKET, path) === value ? path : null;
}

function usageCategory(path: string): PublicMediaUsageKind {
  if (path.startsWith("hero/")) return "hero";
  if (path.startsWith("programs/")) return "program";
  if (path.startsWith("services/")) return "future-learning";
  if (path.startsWith("gallery/")) return "gallery";
  if (path.startsWith("branding/og/")) return "seo";
  return "branding";
}

async function referenceMap(s: SupabaseClient): Promise<Map<string, PublicMediaUsage[]>> {
  const refs = await settingsRepository.listPublicMediaReferences(s);
  const map = new Map<string, PublicMediaUsage[]>();
  const addUrl = (url: string | null, usage: PublicMediaUsage) => {
    const path = canonicalManagedPathFromPublicUrl(s, url);
    if (path) map.set(path, [...(map.get(path) ?? []), usage]);
  };
  addUrl(refs.settings.logo_url, { kind: "branding", label: "School logo", entityId: null });
  addUrl(refs.settings.favicon_url, { kind: "branding", label: "Favicon", entityId: null });
  addUrl(refs.settings.hero_image_url, { kind: "hero", label: "Home hero", entityId: null });
  addUrl(refs.settings.og_image_url, { kind: "seo", label: "Open Graph image", entityId: null });
  for (const item of refs.programs) addUrl(item.image_url, { kind: "program", label: item.title, entityId: item.id });
  for (const item of refs.services) addUrl(item.visual_asset_url, { kind: "future-learning", label: item.title, entityId: item.id });
  for (const item of refs.gallery) {
    const path = isManagedPath(PUBLIC_MEDIA_BUCKET, item.storage_path) ? item.storage_path : canonicalManagedPathFromPublicUrl(s, item.image_url);
    if (path) map.set(path, [...(map.get(path) ?? []), { kind: "gallery", label: item.title, entityId: item.id }]);
  }
  return map;
}

async function listLeafFolder(s: SupabaseClient, folder: string, paths: Map<string, repository.PublicStorageObject>, state: { truncated: boolean }) {
  const entries = await repository.listPublicFolder(s, folder);
  if (entries.length === 100) state.truncated = true;
  for (const entry of entries) {
    const path = `${folder}/${entry.name}`;
    if (entry.id && isManagedPath(PUBLIC_MEDIA_BUCKET, path)) paths.set(path, entry);
  }
}

export async function listPublicMediaLibrary(s: SupabaseClient): Promise<PublicMediaLibrary> {
  const paths = new Map<string, repository.PublicStorageObject>();
  const state = { truncated: false };
  await Promise.all(["branding/logo", "branding/favicon", "branding/og", "hero", "gallery"].map((folder) => listLeafFolder(s, folder, paths, state)));
  for (const root of ["programs", "services"] as const) {
    const folders = await repository.listPublicFolder(s, root);
    if (folders.length === 100) state.truncated = true;
    await Promise.all(folders.filter((entry) => !entry.id && /^[0-9a-f-]{36}$/.test(entry.name)).map((entry) => listLeafFolder(s, `${root}/${entry.name}`, paths, state)));
  }
  const usages = await referenceMap(s);
  const assets: PublicMediaAsset[] = [...paths].map(([path, entry]) => {
    const extension = path.slice(path.lastIndexOf(".") + 1) as PublicMediaAsset["extension"];
    const assetUsages = usages.get(path) ?? [];
    return { path, url: repository.getPublicUrl(s, PUBLIC_MEDIA_BUCKET, path), filename: entry.name, extension, category: usageCategory(path), size: entry.metadata?.size ?? null, createdAt: entry.created_at, usages: assetUsages, isUnused: assetUsages.length === 0 };
  }).toSorted((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || a.path.localeCompare(b.path));
  return { assets, truncated: state.truncated };
}

async function removePublicObjectIfUnused(s: SupabaseClient, path: string): Promise<"deleted" | "used"> {
  if (!isManagedPath(PUBLIC_MEDIA_BUCKET, path)) throw new Error("Invalid managed public media path.");
  if ((await referenceMap(s)).has(path)) return "used";
  await repository.removePublicObject(s, path);
  return "deleted";
}

export async function deleteUnusedPublicMedia(s: SupabaseClient, path: string): Promise<void> {
  if ((await removePublicObjectIfUnused(s, path)) === "used") throw new Error("This image is still in use and cannot be deleted.");
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
  const oldPath = canonicalManagedPathFromPublicUrl(s, currentValue);
  if (oldPath && oldPath !== media.path) await removePublicObjectIfUnused(s, oldPath).catch(() => undefined);
  return media;
}

/**
 * Clears the database reference before attempting Storage cleanup. Persistence
 * errors leave the object intact; cleanup errors are reported after the safe
 * cleared state has been committed and are never rolled back to a stale URL.
 */
export async function clearPublicReference(
  s: SupabaseClient,
  currentValue: string | null,
  persist: (url: string | null) => Promise<unknown>,
): Promise<void> {
  await persist(null);
  const oldPath = canonicalManagedPathFromPublicUrl(s, currentValue);
  if (!oldPath) return;
  try {
    await removePublicObjectIfUnused(s, oldPath);
  } catch {
    throw new PublicMediaCleanupError("Media reference was cleared, but the managed file could not be deleted. Please try cleanup again later.");
  }
}

export async function reusePublicMedia(
  s: SupabaseClient,
  path: string,
  currentValue: string | null,
  persist: (url: string) => Promise<unknown>,
): Promise<StoredMedia> {
  if (!isManagedPath(PUBLIC_MEDIA_BUCKET, path)) throw new Error("Choose a managed public image.");
  const exists = (await listPublicMediaLibrary(s)).assets.some((asset) => asset.path === path);
  if (!exists) throw new Error("The selected public image is no longer available.");
  const url = repository.getPublicUrl(s, PUBLIC_MEDIA_BUCKET, path);
  await persist(url);
  const oldPath = canonicalManagedPathFromPublicUrl(s, currentValue);
  if (oldPath && oldPath !== path) await removePublicObjectIfUnused(s, oldPath).catch(() => undefined);
  return { bucket: PUBLIC_MEDIA_BUCKET, path, url };
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
  const exactPrefix = `${domain}/${id}/photos/`;
  if (currentPath?.startsWith(exactPrefix) && isManagedPath(PRIVATE_MEDIA_BUCKET, currentPath) && currentPath !== media.path) {
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
export async function createGalleryItemFromExisting(s: SupabaseClient, input: GalleryItemInput, path: string): Promise<WebsiteGalleryItem> {
  if (!isManagedPath(PUBLIC_MEDIA_BUCKET, path)) throw new Error("Choose a managed public image.");
  const exists = (await listPublicMediaLibrary(s)).assets.some((asset) => asset.path === path);
  if (!exists) throw new Error("The selected public image is no longer available.");
  return settingsRepository.insertWebsiteGalleryItem(s, { ...input, caption: input.caption || null, category: input.category || null, storage_path: path, image_url: repository.getPublicUrl(s, PUBLIC_MEDIA_BUCKET, path) });
}
export const updateGalleryItem = (s: SupabaseClient, id: string, input: GalleryItemUpdateInput) => settingsRepository.updateWebsiteGalleryItem(s, id, input);
export async function deleteGalleryItem(s: SupabaseClient, id: string): Promise<MediaCleanupResult> {
  const item = (await settingsRepository.listWebsiteGalleryItems(s)).find((entry) => entry.id === id);
  if (!item) throw new Error("Gallery item not found.");
  await settingsRepository.deleteWebsiteGalleryItem(s, id);
  if (!isManagedPath(PUBLIC_MEDIA_BUCKET, item.storage_path)) return { databaseDeleted: true, storageDeleted: false, storageRetainedBecauseUsed: false };
  try {
    const cleanup = await removePublicObjectIfUnused(s, item.storage_path);
    return { databaseDeleted: true, storageDeleted: cleanup === "deleted", storageRetainedBecauseUsed: cleanup === "used" };
  } catch (error) {
    console.error("Gallery database row deleted but managed media cleanup failed", { galleryItemId: id, storagePath: item.storage_path, error });
    return { databaseDeleted: true, storageDeleted: false, storageRetainedBecauseUsed: false, cleanupWarning: "Gallery item was deleted, but its unused image could not be cleaned up." };
  }
}
