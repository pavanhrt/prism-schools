import type { MetadataRoute } from "next";
import { resolvePublicSiteUrl } from "@/features/public/metadata";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

const PUBLIC_PATHS = ["", "/about", "/academics", "/admissions", "/gallery", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSchoolSettingsCached();
  const base = resolvePublicSiteUrl(settings.website_url);
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path || "/", base).toString(),
  }));
}
