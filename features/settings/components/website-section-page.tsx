import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getWebsiteAdminConfig } from "@/features/settings/service";
import { FocusedWebsiteManager, type Section } from "./website-settings-manager";
import { PublicMediaLibraryBrowser } from "@/features/media/components/public-media-library";

const copy: Record<Section, readonly [string, string]> = {
  branding: ["Branding", "Manage the school identity, logo, favicon and brand colours."], hero: ["Homepage", "Edit the homepage banner and guide visitors to the right content."],
  programs: ["Academic Programs", "Marketing content only—these entries never create or change operational School OS classes."], services: ["Future Learning", "Manage public technology and capability experiences."],
  features: ["Why PRISM", "Manage the reasons families see for choosing PRISM."], gallery: ["Gallery", "Publish authentic school images with meaningful alternative text."],
  contact: ["Contact & Social", "Manage public contact details, location and social profiles together."], social: ["Contact & Social", "Manage public contact details and social profiles."], seo: ["SEO", "Set default search and social-sharing information."],
};

export async function WebsiteSectionPage({ section, media = false }: { section: Section; media?: boolean }) {
  const [canRead, canManage] = await Promise.all([hasPermission("website_settings.read"), hasPermission("website_settings.manage")]);
  if (!canRead) redirect("/admin/dashboard");
  const config = await getWebsiteAdminConfig(await createClient());
  const [title, description] = media ? ["Public Media", "Browse managed public website images. Private student and staff files are excluded."] : copy[section];
  return <section className="space-y-5"><div><h2 className="text-xl font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p>{!canManage && <p className="mt-2 text-sm text-amber-700">You have read-only access.</p>}</div>
    {section === "hero" && <div className="flex flex-wrap gap-3 text-sm"><Link className="font-medium text-amber-700 underline" href="/admin/website-settings/programs">Manage programs</Link><Link className="font-medium text-amber-700 underline" href="/admin/website-settings/future-learning">Manage Future Learning</Link><Link className="font-medium text-amber-700 underline" href="/admin/website-settings/why-prism">Manage Why PRISM</Link></div>}
    {media ? <PublicMediaLibraryBrowser canManage={canManage} /> : <FocusedWebsiteManager config={config} canManage={canManage} section={section} />}
  </section>;
}
