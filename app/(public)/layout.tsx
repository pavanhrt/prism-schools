import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/school/site-header";
import { SiteFooter } from "@/components/school/site-footer";
import { getPublicSchoolSettingsCached } from "@/features/public/service";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/gallery", label: "Gallery" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

function absoluteUrl(value: string | null, base: URL): string | undefined {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSchoolSettingsCached();
  const metadataBase = new URL(settings.website_url || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const title = settings.seo_title || `${settings.school_name} | ${settings.tagline}`;
  const description = settings.seo_description || settings.description || undefined;
  const image = absoluteUrl(settings.og_image_url, metadataBase);
  return {
    metadataBase,
    title: { default: title, template: `%s | ${settings.school_name}` },
    description,
    alternates: { canonical: "/" },
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
    openGraph: { type: "website", url: "/", siteName: settings.school_name, title, description, images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getPublicSchoolSettingsCached();
  const address = [settings.address_line || settings.address, settings.city, settings.district, settings.state, settings.postal_code, settings.country].filter(Boolean).join(", ");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: settings.school_name,
    ...(settings.website_url ? { url: settings.website_url } : {}),
    ...(settings.logo_url ? { logo: settings.logo_url } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
    ...(address ? { address } : {}),
    sameAs: [settings.facebook_url, settings.instagram_url, settings.youtube_url, settings.linkedin_url].filter(Boolean),
  };

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

      <main id="main-content" className="flex-1">{children}</main>

      <SiteFooter settings={settings} exploreLinks={NAV} />
    </div>
  );
}
