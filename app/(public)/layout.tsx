import type { ReactNode } from "react";
import { SiteHeader } from "@/components/school/site-header";
import { SiteFooter } from "@/components/school/site-footer";
import { createEducationalOrganizationJsonLd, getPublicLayoutMetadata } from "@/features/public/metadata";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/gallery", label: "Gallery" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export const generateMetadata = getPublicLayoutMetadata;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getPublicSchoolSettingsCached();
  const structuredData = createEducationalOrganizationJsonLd(settings);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 text-prism-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-prism-navy"
      >
        Skip to main content
      </a>
      <SiteHeader nav={NAV} schoolName={settings.school_name} logoUrl={settings.logo_url} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>

      <SiteFooter settings={settings} exploreLinks={NAV} />
    </div>
  );
}
