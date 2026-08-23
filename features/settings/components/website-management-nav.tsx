import Link from "next/link";

const sections = [
  ["Overview", "/admin/website-settings"], ["Branding", "/admin/website-settings/branding"],
  ["Homepage", "/admin/website-settings/homepage"], ["Academic Programs", "/admin/website-settings/programs"],
  ["Future Learning", "/admin/website-settings/future-learning"], ["Why PRISM", "/admin/website-settings/why-prism"],
  ["Gallery", "/admin/website-settings/gallery"], ["Contact & Social", "/admin/website-settings/contact"],
  ["SEO", "/admin/website-settings/seo"], ["Media", "/admin/website-settings/media"],
] as const;

export function WebsiteManagementHeader() {
  return <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Public website CMS</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Website Management</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">Manage PRISM website content and media without a code deployment.</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Public website preview links">{[["Home", "/"], ["Academics", "/academics"], ["Gallery", "/gallery"], ["Contact", "/contact"]].map(([label, href]) => <Link key={href} href={href} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">{label}<span className="sr-only"> (opens in a new tab)</span></Link>)}</div>
    </div>
    <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Website Management sections">{sections.map(([label, href]) => <Link key={href} href={href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">{label}</Link>)}</nav>
  </div>;
}
