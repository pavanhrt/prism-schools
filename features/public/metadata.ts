import type { Metadata } from "next";
import { getPublicSchoolSettingsCached } from "@/features/public/service";
import type { PublicSchoolSettings } from "@/features/public/types";

export const APPROVED_PRODUCTION_SITE_URL = "https://prismschoolnew.netlify.app";

export const PUBLIC_PAGE_SEO = {
  home: {
    path: "/",
    title: "PRISM SCHOOLS | A Modern Legacy of Learning",
    description: "PRISM SCHOOLS combines strong academic foundations with technology, creativity and real-world learning to help students grow with confidence.",
  },
  about: {
    path: "/about",
    title: "About PRISM SCHOOLS | A Modern Legacy of Learning",
    description: "Discover the philosophy, vision and mission of PRISM SCHOOLS, where strong academic foundations prepare learners with curiosity, confidence and purpose.",
  },
  academics: {
    path: "/academics",
    title: "Academics | PRISM SCHOOLS",
    description: "Explore the PRISM academic approach across Pre-Primary, Primary and Secondary stages, with strong foundations, purposeful learning and future-ready capabilities.",
  },
  admissions: {
    path: "/admissions",
    title: "Admissions | PRISM SCHOOLS",
    description: "Begin your child's PRISM journey, learn about our thoughtful admissions process and connect with the school team to discuss the right next step.",
  },
  gallery: {
    path: "/gallery",
    title: "Gallery | PRISM SCHOOLS",
    description: "Discover authentic moments of learning, creativity, technology and community life as the PRISM SCHOOLS gallery grows with our school community.",
  },
  contact: {
    path: "/contact",
    title: "Contact PRISM SCHOOLS",
    description: "Contact PRISM SCHOOLS to ask about admissions, arrange a school visit or begin a conversation with our team about the right next step for your child.",
  },
} as const;

export type PublicPageKey = keyof typeof PUBLIC_PAGE_SEO;

function httpUrl(value: string | null | undefined): URL | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function resolvePublicSiteUrl(
  websiteUrl: string | null | undefined,
  environmentSiteUrl: string | null | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
): URL {
  const allowLocalhost = nodeEnvironment === "development";
  const candidates = [httpUrl(websiteUrl), httpUrl(environmentSiteUrl)];
  const configured = candidates.find((url) => url && (allowLocalhost || url.hostname !== "localhost"));
  if (configured) return new URL(configured.origin);
  if (allowLocalhost) return new URL("http://localhost:3000");
  return new URL(APPROVED_PRODUCTION_SITE_URL);
}

function absoluteHttpUrl(value: string | null | undefined, siteUrl: URL): string | undefined {
  if (!value?.trim()) return undefined;
  const absolute = httpUrl(value);
  if (absolute) return absolute.toString();
  try {
    const resolved = new URL(value.trim(), siteUrl);
    return (resolved.protocol === "http:" || resolved.protocol === "https:") && !resolved.username && !resolved.password
      ? resolved.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function nonEmpty(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export function createPublicLayoutMetadata(settings: PublicSchoolSettings): Metadata {
  const siteUrl = resolvePublicSiteUrl(settings.website_url);
  const schoolName = nonEmpty(settings.school_name, "PRISM SCHOOLS");
  const defaultTitle = nonEmpty(settings.seo_title, `${schoolName} | A Modern Legacy of Learning`);
  const description = nonEmpty(settings.seo_description || settings.description, PUBLIC_PAGE_SEO.home.description);

  return {
    metadataBase: siteUrl,
    title: { default: defaultTitle, template: `%s | ${schoolName}` },
    description,
    icons: { icon: settings.favicon_url?.trim() || "/favicon.ico" },
  };
}

export function createPublicPageMetadata(settings: PublicSchoolSettings, page: PublicPageKey): Metadata {
  const definition = PUBLIC_PAGE_SEO[page];
  const siteUrl = resolvePublicSiteUrl(settings.website_url);
  const title = page === "home" ? nonEmpty(settings.seo_title, definition.title) : definition.title;
  const description = page === "home"
    ? nonEmpty(settings.seo_description || settings.description, definition.description)
    : definition.description;
  const url = new URL(definition.path, siteUrl).toString();
  const image = absoluteHttpUrl(settings.og_image_url, siteUrl);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: definition.path },
    openGraph: {
      type: "website",
      url,
      siteName: nonEmpty(settings.school_name, "PRISM SCHOOLS"),
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    other: { "twitter:url": url },
  };
}

export async function getPublicLayoutMetadata(): Promise<Metadata> {
  return createPublicLayoutMetadata(await getPublicSchoolSettingsCached());
}

export async function getPublicPageMetadata(page: PublicPageKey): Promise<Metadata> {
  return createPublicPageMetadata(await getPublicSchoolSettingsCached(), page);
}

export function createEducationalOrganizationJsonLd(settings: PublicSchoolSettings): Record<string, unknown> {
  const siteUrl = resolvePublicSiteUrl(settings.website_url);
  const logo = absoluteHttpUrl(settings.logo_url, siteUrl)
    || new URL("/branding/prism-logo.png", siteUrl).toString();
  const address = {
    "@type": "PostalAddress",
    ...(settings.address_line?.trim() || settings.address?.trim()
      ? { streetAddress: settings.address_line?.trim() || settings.address?.trim() }
      : {}),
    ...(settings.city?.trim() ? { addressLocality: settings.city.trim() } : {}),
    ...([settings.district, settings.state].filter((value): value is string => Boolean(value?.trim())).length
      ? { addressRegion: [settings.district, settings.state].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()).join(", ") }
      : {}),
    ...(settings.postal_code?.trim() ? { postalCode: settings.postal_code.trim() } : {}),
    ...(settings.country?.trim() ? { addressCountry: settings.country.trim() } : {}),
  };
  const sameAs = [settings.facebook_url, settings.instagram_url, settings.youtube_url, settings.linkedin_url]
    .map((value) => httpUrl(value)?.toString())
    .filter((value): value is string => Boolean(value));

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: nonEmpty(settings.school_name, "PRISM SCHOOLS"),
    url: siteUrl.toString(),
    logo,
    ...(settings.contact_email?.trim() ? { email: settings.contact_email.trim() } : {}),
    ...(settings.contact_phone?.trim() ? { telephone: settings.contact_phone.trim() } : {}),
    ...(Object.keys(address).length > 1 ? { address } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
