import type { SupabaseClient } from "@supabase/supabase-js";
import type { WebsiteAdminConfig } from "@/types/settings";
import type { SchoolSettingsUpdateInput, WebsiteFeatureInput, WebsiteProgramInput, WebsiteServiceInput } from "@/validations/settings";
import * as repo from "./repository";

function nullifyBlankValues<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === "string" && value === "" ? null : value]));
}

export function activeInDisplayOrder<T extends { is_active: boolean; display_order: number; title: string }>(items: T[]): T[] {
  return items.filter((item) => item.is_active).toSorted((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title));
}

export async function getWebsiteAdminConfig(supabase: SupabaseClient): Promise<WebsiteAdminConfig> {
  const [settings, programs, services, features] = await Promise.all([
    repo.getSchoolSettings(supabase), repo.listWebsitePrograms(supabase), repo.listWebsiteServices(supabase), repo.listWebsiteFeatures(supabase),
  ]);
  return { settings, programs, services, features };
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
