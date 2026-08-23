import type { SupabaseClient } from "@supabase/supabase-js";
import type { WebsiteAdminConfig } from "@/types/settings";
import type { WebsiteGalleryItem } from "@/types/media";
import type { SchoolSettingsUpdateInput, WebsiteFeatureInput, WebsiteProgramInput, WebsiteServiceInput } from "@/validations/settings";
import * as repo from "./repository";

function nullifyBlankValues<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === "string" && value === "" ? null : value]));
}

export function activeInDisplayOrder<T extends { is_active: boolean; display_order: number; title: string }>(items: T[]): T[] {
  return items.filter((item) => item.is_active).toSorted((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title));
}

export async function getWebsiteAdminConfig(supabase: SupabaseClient): Promise<WebsiteAdminConfig> {
  const [settings, programs, services, features, gallery] = await Promise.all([
    repo.getSchoolSettings(supabase), repo.listWebsitePrograms(supabase), repo.listWebsiteServices(supabase), repo.listWebsiteFeatures(supabase), repo.listWebsiteGalleryItems(supabase),
  ]);
  return { settings, programs, services, features, gallery };
}

export type OrderedWebsiteRecord = { id: string; display_order: number };
export function normalizedMove<T extends OrderedWebsiteRecord>(items: T[], id: string, direction: "up" | "down"): T[] {
  const ordered = items.map((item, index) => ({ item, index }))
    .toSorted((a, b) => a.item.display_order - b.item.display_order || a.index - b.index)
    .map(({ item }) => item);
  const from = ordered.findIndex((item) => item.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from >= 0 && to >= 0 && to < ordered.length) [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return ordered.map((item, display_order) => ({ ...item, display_order }));
}

export async function reorderWebsiteCollection(
  s: SupabaseClient,
  collection: "programs" | "services" | "features" | "gallery",
  id: string,
  direction: "up" | "down",
) {
  const definitions = {
    programs: [repo.listWebsitePrograms, "website_programs"],
    services: [repo.listWebsiteServices, "website_services"],
    features: [repo.listWebsiteFeatures, "website_features"],
    gallery: [repo.listWebsiteGalleryItems, "website_gallery_items"],
  } as const;
  const [list, table] = definitions[collection];
  const items = await list(s) as (WebsiteAdminConfig["programs"][number] | WebsiteAdminConfig["services"][number] | WebsiteAdminConfig["features"][number] | WebsiteGalleryItem)[];
  const normalized = normalizedMove(items, id, direction);
  const changed = normalized.filter((item, index) => item.display_order !== items[index]?.display_order || item.id !== items[index]?.id);
  if (changed.length) await repo.updateWebsiteDisplayOrders(s, table, normalized.map(({ id: recordId, display_order }) => ({ id: recordId, display_order })));
}

export const updateSchoolSettings = (s: SupabaseClient, input: SchoolSettingsUpdateInput) => repo.updateSchoolSettings(s, nullifyBlankValues(input));
export const createWebsiteProgram = (s: SupabaseClient, input: WebsiteProgramInput) => repo.insertWebsiteProgram(s, nullifyBlankValues(input));
export const updateWebsiteProgram = (s: SupabaseClient, id: string, input: WebsiteProgramInput) => repo.updateWebsiteProgram(s, id, nullifyBlankValues(input));
export const deleteWebsiteProgram = repo.deleteWebsiteProgram;
export const createWebsiteService = (s: SupabaseClient, input: WebsiteServiceInput) => repo.insertWebsiteService(s, nullifyBlankValues(input));
export const updateWebsiteService = (s: SupabaseClient, id: string, input: WebsiteServiceInput) => repo.updateWebsiteService(s, id, nullifyBlankValues(input));
export const deleteWebsiteService = repo.deleteWebsiteService;
export const createWebsiteFeature = (s: SupabaseClient, input: WebsiteFeatureInput) => repo.insertWebsiteFeature(s, nullifyBlankValues(input));
export const updateWebsiteFeature = (s: SupabaseClient, id: string, input: WebsiteFeatureInput) => repo.updateWebsiteFeature(s, id, nullifyBlankValues(input));
export const deleteWebsiteFeature = repo.deleteWebsiteFeature;
