import type { SchoolSettings, WebsiteFeature, WebsiteProgram, WebsiteService } from "@/types/settings";

export type PublicSchoolSettings = Pick<SchoolSettings,
  | "id" | "school_name" | "short_name" | "tagline" | "description"
  | "logo_url" | "favicon_url" | "primary_color" | "secondary_color" | "accent_color"
  | "hero_eyebrow" | "hero_tagline" | "hero_title" | "hero_description"
  | "hero_primary_cta_label" | "hero_primary_cta_url"
  | "hero_secondary_cta_label" | "hero_secondary_cta_url"
  | "contact_email" | "contact_phone" | "website_url" | "address" | "address_line"
  | "city" | "district" | "state" | "country" | "postal_code" | "google_maps_url"
  | "facebook_url" | "instagram_url" | "youtube_url" | "linkedin_url"
  | "seo_title" | "seo_description" | "og_image_url"
>;

export type PublicWebsiteProgram = WebsiteProgram;
export type PublicWebsiteService = WebsiteService;
export type PublicWebsiteFeature = WebsiteFeature;

export interface PublicWebsiteConfig {
  settings: PublicSchoolSettings;
  programs: PublicWebsiteProgram[];
  services: PublicWebsiteService[];
  features: PublicWebsiteFeature[];
}
