import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";
import { SiteHeader } from "@/components/school/site-header";
import { SiteFooter } from "@/components/school/site-footer";
import { PRISM_SCHOOL_NAME } from "@/components/school/brand";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/gallery", label: "Gallery" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 text-prism-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-prism-navy"
      >
        Skip to main content
      </a>
      <SiteHeader schoolName={PRISM_SCHOOL_NAME} nav={NAV} />

      <main id="main-content" className="flex-1">{children}</main>

      <SiteFooter schoolName={PRISM_SCHOOL_NAME} settings={settings} exploreLinks={NAV} />
    </div>
  );
}
