import type { SupabaseClient } from "@supabase/supabase-js";
import type { SchoolSettings, WebsiteFeature, WebsiteProgram, WebsiteService } from "@/types/settings";
import type { WebsiteGalleryItem } from "@/types/media";

export async function getSchoolSettings(supabase: SupabaseClient): Promise<SchoolSettings> {
  const { data, error } = await supabase
    .from("school_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSchoolSettings(supabase: SupabaseClient, input: Record<string, unknown>): Promise<SchoolSettings> {
  const { data, error } = await supabase.rpc("update_website_settings", { p_settings: input });
  if (error) throw error;
  return data as SchoolSettings;
}

async function listOrdered<T>(supabase: SupabaseClient, table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*").order("display_order").order("title");
  if (error) throw error;
  return data as T[];
}
export const listWebsitePrograms = (s: SupabaseClient) => listOrdered<WebsiteProgram>(s, "website_programs");
export const listWebsiteServices = (s: SupabaseClient) => listOrdered<WebsiteService>(s, "website_services");
export const listWebsiteFeatures = (s: SupabaseClient) => listOrdered<WebsiteFeature>(s, "website_features");
export const listWebsiteGalleryItems = (s: SupabaseClient) => listOrdered<WebsiteGalleryItem>(s, "website_gallery_items");

async function insertRow<T>(s: SupabaseClient, table: string, input: Record<string, unknown>): Promise<T> { const { data, error } = await s.from(table).insert(input).select().single(); if (error) throw error; return data as T; }
async function updateRow<T>(s: SupabaseClient, table: string, id: string, input: Record<string, unknown>): Promise<T> { const { data, error } = await s.from(table).update(input).eq("id", id).select().single(); if (error) throw error; return data as T; }
async function deleteRow(s: SupabaseClient, table: string, id: string): Promise<void> { const { error } = await s.from(table).delete().eq("id", id); if (error) throw error; }
export const insertWebsiteProgram = (s: SupabaseClient, i: Record<string, unknown>) => insertRow<WebsiteProgram>(s, "website_programs", i);
export const updateWebsiteProgram = (s: SupabaseClient, id: string, i: Record<string, unknown>) => updateRow<WebsiteProgram>(s, "website_programs", id, i);
export const deleteWebsiteProgram = (s: SupabaseClient, id: string) => deleteRow(s, "website_programs", id);
export const insertWebsiteService = (s: SupabaseClient, i: Record<string, unknown>) => insertRow<WebsiteService>(s, "website_services", i);
export const updateWebsiteService = (s: SupabaseClient, id: string, i: Record<string, unknown>) => updateRow<WebsiteService>(s, "website_services", id, i);
export const deleteWebsiteService = (s: SupabaseClient, id: string) => deleteRow(s, "website_services", id);
export const insertWebsiteFeature = (s: SupabaseClient, i: Record<string, unknown>) => insertRow<WebsiteFeature>(s, "website_features", i);
export const updateWebsiteFeature = (s: SupabaseClient, id: string, i: Record<string, unknown>) => updateRow<WebsiteFeature>(s, "website_features", id, i);
export const deleteWebsiteFeature = (s: SupabaseClient, id: string) => deleteRow(s, "website_features", id);
export const insertWebsiteGalleryItem = (s: SupabaseClient, i: Record<string, unknown>) => insertRow<WebsiteGalleryItem>(s, "website_gallery_items", i);
export const updateWebsiteGalleryItem = (s: SupabaseClient, id: string, i: Record<string, unknown>) => updateRow<WebsiteGalleryItem>(s, "website_gallery_items", id, i);
export const deleteWebsiteGalleryItem = (s: SupabaseClient, id: string) => deleteRow(s, "website_gallery_items", id);
