import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";
import { SiteHeader } from "@/components/school/site-header";
import { SiteFooter } from "@/components/school/site-footer";

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
      <SiteHeader schoolName={settings.school_name} nav={NAV} />

      <main className="flex-1">{children}</main>

      <SiteFooter schoolName={settings.school_name} settings={settings} exploreLinks={NAV} />
    </div>
  );
}
