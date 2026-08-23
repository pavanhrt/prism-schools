import { unstable_cache } from "next/cache";
import {
  createPublicClient,
  getPublicSchoolSettings,
  listActiveWebsiteFeatures,
  listActiveWebsitePrograms,
  listActiveWebsiteServices,
} from "@/features/public/repository";
import type { PublicSchoolSettings, PublicWebsiteConfig } from "@/features/public/types";

export const PUBLIC_WEBSITE_CACHE_TAG = "public-website-config";

const FALLBACK_SETTINGS: PublicSchoolSettings = {
  id: 1,
  school_name: "PRISM SCHOOLS",
  short_name: "PRISM",
  tagline: "A Modern Legacy of Learning",
  description: "A modern, future-focused school combining strong academic foundations with technology, creativity, and real-world learning.",
  logo_url: "/branding/prism-logo.png",
  favicon_url: "/favicon.ico",
  primary_color: "#071a3d",
  secondary_color: "#ffffff",
  accent_color: "#c9a227",
  hero_eyebrow: "PRISM SCHOOLS",
  hero_tagline: "A Modern Legacy of Learning",
  hero_title: "Where Learning Meets the Future",
  hero_description: "We go beyond textbooks — empowering students with AI, robotics, technology, creativity and real-world experiences to build the skills of tomorrow.",
  hero_primary_cta_label: "Explore Our School",
  hero_primary_cta_url: "/about",
  hero_secondary_cta_label: "Discover Future Learning",
  hero_secondary_cta_url: "/academics",
  contact_email: null,
  contact_phone: null,
  website_url: null,
  address: null,
  address_line: null,
  city: null,
  district: null,
  state: null,
  country: null,
  postal_code: null,
  google_maps_url: null,
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  linkedin_url: null,
  seo_title: "PRISM SCHOOLS | A Modern Legacy of Learning",
  seo_description: "PRISM SCHOOLS combines strong academic foundations with technology, creativity, and real-world learning.",
  og_image_url: null,
};

function cleanSettings(settings: PublicSchoolSettings | null): PublicSchoolSettings {
  if (!settings) return FALLBACK_SETTINGS;
  return { ...FALLBACK_SETTINGS, ...settings };
}

async function loadPublicSchoolWebsiteConfig(): Promise<PublicWebsiteConfig> {
  const supabase = createPublicClient();
  const results = await Promise.allSettled([
    getPublicSchoolSettings(supabase),
    listActiveWebsitePrograms(supabase),
    listActiveWebsiteServices(supabase),
    listActiveWebsiteFeatures(supabase),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Public website CMS read ${index + 1} failed`, result.reason);
    }
  });
  return {
    settings: cleanSettings(results[0].status === "fulfilled" ? results[0].value : null),
    programs: results[1].status === "fulfilled" ? results[1].value : [],
    services: results[2].status === "fulfilled" ? results[2].value : [],
    features: results[3].status === "fulfilled" ? results[3].value : [],
  };
}

export const getPublicSchoolWebsiteConfig = unstable_cache(
  loadPublicSchoolWebsiteConfig,
  [PUBLIC_WEBSITE_CACHE_TAG],
  { tags: [PUBLIC_WEBSITE_CACHE_TAG], revalidate: 3600 },
);

export const getPublicSchoolSettingsCached = unstable_cache(
  async () => {
    try {
      return cleanSettings(await getPublicSchoolSettings(createPublicClient()));
    } catch (error) {
      console.error("Public school settings CMS read failed", error);
      return FALLBACK_SETTINGS;
    }
  },
  ["public-school-settings"],
  { tags: [PUBLIC_WEBSITE_CACHE_TAG], revalidate: 3600 },
);

export function formatPublicAddress(settings: PublicSchoolSettings): string | null {
  const parts = [
    settings.address_line || settings.address,
    settings.city,
    settings.district,
    settings.state,
    settings.postal_code,
    settings.country,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.length ? parts.join(", ") : null;
}
