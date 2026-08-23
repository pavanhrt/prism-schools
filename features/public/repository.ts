import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  PublicSchoolSettings,
  PublicWebsiteFeature,
  PublicWebsiteProgram,
  PublicWebsiteService,
} from "@/features/public/types";

export function createPublicClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function getPublicSchoolSettings(
  supabase: SupabaseClient,
): Promise<PublicSchoolSettings | null> {
  const { data, error } = await supabase
    .from("school_settings")
    .select("id, school_name, short_name, tagline, description, logo_url, favicon_url, primary_color, secondary_color, accent_color, hero_eyebrow, hero_tagline, hero_title, hero_description, hero_primary_cta_label, hero_primary_cta_url, hero_secondary_cta_label, hero_secondary_cta_url, contact_email, contact_phone, website_url, address, address_line, city, district, state, country, postal_code, google_maps_url, facebook_url, instagram_url, youtube_url, linkedin_url, seo_title, seo_description, og_image_url")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listActiveWebsitePrograms(
  supabase: SupabaseClient,
): Promise<PublicWebsiteProgram[]> {
  const { data, error } = await supabase
    .from("website_programs")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listActiveWebsiteServices(
  supabase: SupabaseClient,
): Promise<PublicWebsiteService[]> {
  const { data, error } = await supabase
    .from("website_services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listActiveWebsiteFeatures(
  supabase: SupabaseClient,
): Promise<PublicWebsiteFeature[]> {
  const { data, error } = await supabase
    .from("website_features")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
