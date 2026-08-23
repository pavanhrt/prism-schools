"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { refreshPublicWebsite } from "@/features/public/revalidation";
import { entityIdSchema, galleryItemIdSchema, galleryItemSchema, galleryItemUpdateSchema, galleryReuseSchema, managedPublicMediaPathSchema, publicMediaReuseSchema, type GalleryItemUpdateInput } from "@/validations/media";
import type { PublicMediaLibrary, StoredMedia } from "@/types/media";
import * as service from "./service";
import * as settingsRepository from "@/features/settings/repository";
import * as studentsRepository from "@/features/students/repository";
import * as staffRepository from "@/features/staff/repository";

export type MediaActionResult = { ok: true; media: StoredMedia } | { ok: false; error: string };
export type RemoveMediaActionResult = { ok: true } | { ok: false; error: string; referenceCleared?: boolean };
export type GalleryActionResult = { ok: true; warning?: string } | { ok: false; error: string };
export type PublicMediaLibraryActionResult = { ok: true; library: PublicMediaLibrary } | { ok: false; error: string };
const categorySchema = z.enum(["branding-logo", "branding-favicon", "hero", "og-image", "program", "service"]);
const USER_ERRORS = ["Choose", "Image exceeds", "Only JPEG", "File content", "not found", "still in use", "no longer available", "domain mismatch", "Invalid private media path"];
const errorText = (error: unknown, fallback: string, operation = "media action") => {
  console.error(`${operation} failed`, error);
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  if (error instanceof Error && USER_ERRORS.some((prefix) => error.message.includes(prefix))) return error.message;
  return fallback;
};
function getFile(data: FormData) { const file = data.get("file"); if (!(file instanceof File)) throw new Error("Choose an image."); return file; }

export async function uploadPublicMediaAction(category: string, entityId: string | null, data: FormData): Promise<MediaActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const kind = categorySchema.parse(category);
    const id = kind === "program" || kind === "service" ? entityIdSchema.parse(entityId) : undefined;
    const client = await createClient();
    let current: string | null;
    let persist: (url: string) => Promise<unknown>;
    if (kind === "program") {
      const record = (await settingsRepository.listWebsitePrograms(client)).find((item) => item.id === id);
      if (!record) throw new Error("Program not found.");
      current = record.image_url;
      persist = (url) => settingsRepository.updateWebsiteProgram(client, id!, { image_url: url });
    } else if (kind === "service") {
      const record = (await settingsRepository.listWebsiteServices(client)).find((item) => item.id === id);
      if (!record) throw new Error("Service not found.");
      current = record.visual_asset_url;
      persist = (url) => settingsRepository.updateWebsiteService(client, id!, { visual_asset_url: url });
    } else {
      const settings = await settingsRepository.getSchoolSettings(client);
      const field = ({ "branding-logo": "logo_url", "branding-favicon": "favicon_url", hero: "hero_image_url", "og-image": "og_image_url" } as const)[kind];
      current = settings[field];
      persist = (url) => settingsRepository.updateSchoolSettings(client, { [field]: url });
    }
    const media = await service.replacePublicReference(client, kind, getFile(data), current, persist, id);
    refreshPublicWebsite(); revalidatePath("/admin/website-settings");
    return { ok: true, media };
  } catch (error) { return { ok: false, error: errorText(error, "Could not upload media.", "public media upload") }; }
}

export async function listPublicMediaLibraryAction(): Promise<PublicMediaLibraryActionResult> {
  try {
    await requirePermission("website_settings.read");
    return { ok: true, library: await service.listPublicMediaLibrary(await createClient()) };
  } catch (error) {
    return { ok: false, error: errorText(error, "Could not load the public media library.", "public media listing") };
  }
}

export async function reusePublicMediaAction(input: unknown): Promise<MediaActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const parsed = publicMediaReuseSchema.parse(input);
    const kind = parsed.category;
    const id = kind === "program" || kind === "service" ? entityIdSchema.parse(parsed.entityId) : undefined;
    const client = await createClient();
    let current: string | null;
    let persist: (url: string) => Promise<unknown>;
    if (kind === "program") {
      const record = (await settingsRepository.listWebsitePrograms(client)).find((item) => item.id === id);
      if (!record) throw new Error("Program not found.");
      current = record.image_url; persist = (url) => settingsRepository.updateWebsiteProgram(client, id!, { image_url: url });
    } else if (kind === "service") {
      const record = (await settingsRepository.listWebsiteServices(client)).find((item) => item.id === id);
      if (!record) throw new Error("Service not found.");
      current = record.visual_asset_url; persist = (url) => settingsRepository.updateWebsiteService(client, id!, { visual_asset_url: url });
    } else {
      const settings = await settingsRepository.getSchoolSettings(client);
      const field = ({ "branding-logo": "logo_url", "branding-favicon": "favicon_url", hero: "hero_image_url", "og-image": "og_image_url" } as const)[kind];
      current = settings[field]; persist = (url) => settingsRepository.updateSchoolSettings(client, { [field]: url });
    }
    const media = await service.reusePublicMedia(client, parsed.path, current, persist);
    refreshPublicWebsite(); revalidatePath("/admin/website-settings");
    return { ok: true, media };
  } catch (error) { return { ok: false, error: errorText(error, "Could not reuse the selected image.", "public media reuse") }; }
}

export async function deleteUnusedPublicMediaAction(path: string): Promise<GalleryActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const parsedPath = managedPublicMediaPathSchema.parse(path);
    await service.deleteUnusedPublicMedia(await createClient(), parsedPath);
    revalidatePath("/admin/website-settings");
    return { ok: true };
  } catch (error) { return { ok: false, error: errorText(error, "Could not delete the unused image.", "unused public media deletion") }; }
}

export async function removePublicMediaAction(category: string, entityId: string | null): Promise<RemoveMediaActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const kind = categorySchema.parse(category);
    const id = kind === "program" || kind === "service" ? entityIdSchema.parse(entityId) : undefined;
    const client = await createClient();
    let current: string | null;
    let persist: (url: string | null) => Promise<unknown>;
    if (kind === "program") {
      const record = (await settingsRepository.listWebsitePrograms(client)).find((item) => item.id === id);
      if (!record) throw new Error("Program not found.");
      current = record.image_url;
      persist = (url) => settingsRepository.updateWebsiteProgram(client, id!, { image_url: url });
    } else if (kind === "service") {
      const record = (await settingsRepository.listWebsiteServices(client)).find((item) => item.id === id);
      if (!record) throw new Error("Service not found.");
      current = record.visual_asset_url;
      persist = (url) => settingsRepository.updateWebsiteService(client, id!, { visual_asset_url: url });
    } else {
      const settings = await settingsRepository.getSchoolSettings(client);
      const field = ({ "branding-logo": "logo_url", "branding-favicon": "favicon_url", hero: "hero_image_url", "og-image": "og_image_url" } as const)[kind];
      current = settings[field];
      persist = (url) => settingsRepository.updateSchoolSettings(client, { [field]: url });
    }
    await service.clearPublicReference(client, current, persist);
    refreshPublicWebsite(); revalidatePath("/admin/website-settings");
    return { ok: true };
  } catch (error) {
    if (error instanceof service.PublicMediaCleanupError) {
      refreshPublicWebsite(); revalidatePath("/admin/website-settings");
      return { ok: false, error: error.message, referenceCleared: true };
    }
    return { ok: false, error: errorText(error, "Could not remove media.") };
  }
}

async function uploadPrivate(domain: "students" | "staff", id: string, data: FormData): Promise<MediaActionResult> {
  try {
    await requirePermission(domain === "students" ? "students.edit" : "staff.edit");
    const parsedId = entityIdSchema.parse(id); const client = await createClient();
    const record = domain === "students" ? await studentsRepository.getStudent(client, parsedId) : await staffRepository.getStaff(client, parsedId);
    if (!record) throw new Error(`${domain === "students" ? "Student" : "Staff member"} not found.`);
    const persist = domain === "students"
      ? (path: string) => studentsRepository.updateStudentPhoto(client, parsedId, path)
      : (path: string) => staffRepository.updateStaffPhoto(client, parsedId, path);
    const media = await service.replacePrivatePhoto(client, domain, parsedId, getFile(data), record.photo_url, persist);
    revalidatePath(`/admin/${domain}/${parsedId}`);
    return { ok: true, media };
  } catch (error) { return { ok: false, error: errorText(error, "Could not upload private photo.") }; }
}
export async function uploadStudentPhotoAction(id: string, data: FormData) { return uploadPrivate("students", id, data); }
export async function uploadStaffPhotoAction(id: string, data: FormData) { return uploadPrivate("staff", id, data); }

export async function createPrivatePhotoSignedUrlAction(domain: "students" | "staff", path: string) {
  try {
    await requirePermission(domain === "students" ? "students.view" : "staff.view");
    if (!path.startsWith(`${domain}/`)) throw new Error("Private media domain mismatch.");
    return { ok: true as const, url: await service.getPrivateSignedUrl(await createClient(), path), expiresIn: service.PRIVATE_SIGNED_URL_TTL_SECONDS };
  } catch (error) { return { ok: false as const, error: errorText(error, "Could not create private media link.") }; }
}

export async function createGalleryItemAction(data: FormData): Promise<GalleryActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const input = galleryItemSchema.parse({ title: data.get("title"), caption: data.get("caption"), category: data.get("category"), alt_text: data.get("alt_text"), display_order: data.get("display_order") ?? 0, is_active: ["true", "on"].includes(String(data.get("is_active"))) });
    await service.createGalleryItem(await createClient(), input, getFile(data));
    refreshPublicWebsite(); revalidatePath("/gallery"); revalidatePath("/admin/website-settings"); return { ok: true };
  } catch (error) { return { ok: false, error: errorText(error, "Could not create gallery item.") }; }
}
export async function createGalleryItemFromExistingAction(input: unknown): Promise<GalleryActionResult> {
  try {
    await requirePermission("website_settings.manage");
    const parsed = galleryReuseSchema.parse(input);
    const { path, ...galleryInput } = parsed;
    await service.createGalleryItemFromExisting(await createClient(), galleryInput, path);
    refreshPublicWebsite(); revalidatePath("/gallery"); revalidatePath("/admin/website-settings");
    return { ok: true };
  } catch (error) { return { ok: false, error: errorText(error, "Could not add the selected image to the gallery.", "gallery media reuse") }; }
}
export async function updateGalleryItemAction(id: string, input: GalleryItemUpdateInput): Promise<GalleryActionResult> {
  try { await requirePermission("website_settings.manage"); await service.updateGalleryItem(await createClient(), galleryItemIdSchema.parse(id), galleryItemUpdateSchema.parse(input)); refreshPublicWebsite(); revalidatePath("/gallery"); return { ok: true }; }
  catch (error) { return { ok: false, error: errorText(error, "Could not update gallery item.") }; }
}
export async function setGalleryItemActiveAction(id: string, active: boolean) { return updateGalleryItemAction(id, { is_active: active }); }
export async function deleteGalleryItemAction(id: string): Promise<GalleryActionResult> {
  try { await requirePermission("website_settings.manage"); const result = await service.deleteGalleryItem(await createClient(), galleryItemIdSchema.parse(id)); refreshPublicWebsite(); revalidatePath("/gallery"); revalidatePath("/admin/website-settings"); return { ok: true, warning: result.cleanupWarning }; }
  catch (error) { return { ok: false, error: errorText(error, "Could not permanently delete gallery item.") }; }
}
