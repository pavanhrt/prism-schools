import Link from "next/link";
import type { WebsiteAdminConfig } from "@/types/settings";

export function WebsiteManagementOverview({ config }: { config: WebsiteAdminConfig }) {
  const active = <T extends { is_active: boolean }>(items: T[]) => items.filter((item) => item.is_active).length;
  const cards = [
    ["Branding", "School identity, logo, favicon and colours", config.settings.logo_url ? "Logo configured" : "Logo not configured", "branding"],
    ["Homepage", "Main banner content and hero image", config.settings.hero_image_url ? "Hero image configured" : "Using the PRISM visual", "homepage"],
    ["Academic Programs", "Public marketing programs, separate from School OS classes", `${active(config.programs)} active programs`, "programs"],
    ["Future Learning", "Technology and capability experiences", `${active(config.services)} active services`, "future-learning"],
    ["Why PRISM", "Public website differentiators", `${active(config.features)} active features`, "why-prism"],
    ["Gallery", "Authentic published school moments", `${active(config.gallery)} published images`, "gallery"],
    ["Contact & Social", "Public contact details and social profiles", config.settings.contact_email ? "Contact email configured" : "Contact email needed", "contact"],
    ["SEO", "Search and sharing information", config.settings.seo_title ? "SEO title configured" : "SEO title needed", "seo"],
    ["Media", "Managed public website images", "Public media only", "media"],
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([title, copy, status, path]) => <article key={path} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-2 flex-1 text-sm text-slate-500">{copy}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700">{status}</p><Link href={`/admin/website-settings/${path}`} className="mt-3 text-sm font-semibold text-slate-800 underline decoration-amber-400 decoration-2 underline-offset-4">Manage {title}</Link></article>)}</div>;
}
