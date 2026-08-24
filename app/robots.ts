import type { MetadataRoute } from "next";
import { resolvePublicSiteUrl } from "@/features/public/metadata";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSchoolSettingsCached();
  const base = resolvePublicSiteUrl(settings.website_url);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/api", "/auth"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
