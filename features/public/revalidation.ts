import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_WEBSITE_CACHE_TAG } from "@/features/public/service";

const PUBLIC_PATHS = ["/", "/about", "/academics", "/admissions", "/gallery", "/contact"];

/** Call after a successful CMS mutation from a Server Action. */
export function refreshPublicWebsite(): void {
  updateTag(PUBLIC_WEBSITE_CACHE_TAG);
  for (const path of PUBLIC_PATHS) revalidatePath(path);
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
