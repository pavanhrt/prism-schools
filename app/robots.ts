import type { MetadataRoute } from "next";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSchoolSettingsCached();
  const base = (settings.website_url || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/api", "/auth"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
