import type { MetadataRoute } from "next";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

const PUBLIC_PATHS = ["", "/about", "/academics", "/gallery", "/admissions", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSchoolSettingsCached();
  const base = (settings.website_url || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
