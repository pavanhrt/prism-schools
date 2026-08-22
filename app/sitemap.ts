import type { MetadataRoute } from "next";

const PUBLIC_PATHS = ["", "/about", "/academics", "/gallery", "/admissions", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
