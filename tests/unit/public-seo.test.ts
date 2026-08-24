import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import {
  APPROVED_PRODUCTION_SITE_URL,
  createEducationalOrganizationJsonLd,
  createPublicLayoutMetadata,
  createPublicPageMetadata,
  PUBLIC_PAGE_SEO,
  resolvePublicSiteUrl,
} from "@/features/public/metadata";
import type { PublicSchoolSettings } from "@/features/public/types";

function absoluteTitle(metadata: Metadata) {
  const { title } = metadata;

  return title !== null && typeof title === "object" && "absolute" in title
    ? title.absolute
    : undefined;
}

function metadataBaseOrigin(metadata: Metadata) {
  const metadataBase = metadata.metadataBase as URL | string | null | undefined;

  if (typeof metadataBase === "string") {
    return new URL(metadataBase).origin;
  }

  return metadataBase?.origin;
}

const settings = {
  school_name: "PRISM SCHOOLS",
  tagline: "A Modern Legacy of Learning",
  description: "A factual school description.",
  website_url: null,
  logo_url: null,
  favicon_url: null,
  seo_title: null,
  seo_description: null,
  og_image_url: null,
  address: null,
  address_line: "10 Learning Road",
  city: "Hyderabad",
  district: "Ranga Reddy",
  state: "Telangana",
  postal_code: "500001",
  country: "India",
  contact_email: "hello@example.com",
  contact_phone: "+91 12345 67890",
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  linkedin_url: null,
} as PublicSchoolSettings;

describe("public SEO URL resolution", () => {
  it("uses the CMS origin before the environment origin and strips paths", () => {
    expect(resolvePublicSiteUrl("https://school.example/about?q=1", "https://env.example/base", "production").toString())
      .toBe("https://school.example/");
  });

  it("uses a valid environment origin when the CMS URL is invalid", () => {
    expect(resolvePublicSiteUrl("ftp://school.example", "https://env.example/path", "production").toString())
      .toBe("https://env.example/");
  });

  it("rejects credentials and non-http protocols", () => {
    expect(resolvePublicSiteUrl("https://user:secret@school.example", "javascript:alert(1)", "production").origin)
      .toBe(APPROVED_PRODUCTION_SITE_URL);
  });

  it("allows localhost only in development", () => {
    expect(resolvePublicSiteUrl(null, "http://localhost:4100/path", "development").origin)
      .toBe("http://localhost:4100");
    expect(resolvePublicSiteUrl(null, "http://localhost:4100/path", "production").origin)
      .toBe(APPROVED_PRODUCTION_SITE_URL);
    expect(resolvePublicSiteUrl(null, null, "development").origin).toBe("http://localhost:3000");
  });

  it("never emits localhost from production fallback metadata", () => {
    const metadata = createPublicPageMetadata({ ...settings, website_url: "http://localhost:3000" }, "home");
    expect(JSON.stringify(metadata)).not.toContain("localhost");
  });
});

describe("public page metadata", () => {
  it("provides six unique canonicals and page-specific social fields", () => {
    const entries = Object.keys(PUBLIC_PAGE_SEO).map((page) =>
      createPublicPageMetadata(settings, page as keyof typeof PUBLIC_PAGE_SEO));
    const exactTitles = [
      "PRISM SCHOOLS | A Modern Legacy of Learning",
      "About PRISM SCHOOLS | A Modern Legacy of Learning",
      "Academics | PRISM SCHOOLS",
      "Admissions | PRISM SCHOOLS",
      "Gallery | PRISM SCHOOLS",
      "Contact PRISM SCHOOLS",
    ];
    expect(new Set(entries.map((entry) => entry.alternates?.canonical)).size).toBe(6);
    expect(new Set(entries.map((entry) => entry.openGraph?.url)).size).toBe(6);
    expect(entries.map((entry) => absoluteTitle(entry))).toEqual(exactTitles);

    entries.forEach((entry) => {
      expect(entry.description).toBeTruthy();
      expect(entry.openGraph?.title).toBe(absoluteTitle(entry));
      expect(entry.openGraph?.description).toBe(entry.description);
      expect(entry.twitter?.title).toBe(absoluteTitle(entry));
      expect(entry.twitter?.description).toBe(entry.description);
      expect(entry.other?.["twitter:url"]).toBe(entry.openGraph?.url);
    });
  });

  it("uses configured home SEO values and a non-empty approved fallback", () => {
    const configured = createPublicPageMetadata({
      ...settings,
      seo_title: "Configured title",
      seo_description: "Configured description",
    }, "home");
    expect(absoluteTitle(configured)).toBe("Configured title");
    expect(configured.description).toBe("Configured description");

    const fallback = createPublicPageMetadata({ ...settings, description: "", seo_description: "" }, "home");
    expect(fallback.description).toBe(PUBLIC_PAGE_SEO.home.description);
  });

  it("resolves a relative Open Graph image on the approved origin and rejects unsafe URLs", () => {
    const withoutImage = createPublicPageMetadata(settings, "about");
    expect(withoutImage.openGraph?.images).toBeUndefined();
    expect(withoutImage.twitter?.images).toBeUndefined();

    const relativeImage = createPublicPageMetadata({ ...settings, og_image_url: "/branding/og.png" }, "about");
    expect(relativeImage.openGraph?.images).toEqual([`${APPROVED_PRODUCTION_SITE_URL}/branding/og.png`]);
    expect(relativeImage.twitter?.images).toEqual([`${APPROVED_PRODUCTION_SITE_URL}/branding/og.png`]);

    const credentialedImage = createPublicPageMetadata({
      ...settings,
      og_image_url: "https://user:secret@assets.example/og.png",
    }, "about");
    expect(credentialedImage.openGraph?.images).toBeUndefined();

    const nonHttpImage = createPublicPageMetadata({ ...settings, og_image_url: "javascript:alert(1)" }, "about");
    expect(nonHttpImage.openGraph?.images).toBeUndefined();
  });

  it("builds safe layout defaults without route canonical or social metadata", () => {
    const metadata = createPublicLayoutMetadata({ ...settings, description: "", seo_description: "" });
    expect(metadataBaseOrigin(metadata)).toBe(APPROVED_PRODUCTION_SITE_URL);
    expect(metadata.description).toBe(PUBLIC_PAGE_SEO.home.description);
    expect(metadata.icons).toEqual({ icon: "/favicon.ico" });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });
});

describe("EducationalOrganization structured data", () => {
  it("uses absolute production URLs, a PostalAddress, and omits empty sameAs", () => {
    const jsonLd = createEducationalOrganizationJsonLd(settings);
    expect(jsonLd.url).toBe(`${APPROVED_PRODUCTION_SITE_URL}/`);
    expect(jsonLd.logo).toBe(`${APPROVED_PRODUCTION_SITE_URL}/branding/prism-logo.png`);
    expect(jsonLd.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "10 Learning Road",
      addressLocality: "Hyderabad",
      addressRegion: "Ranga Reddy, Telangana",
      postalCode: "500001",
      addressCountry: "India",
    });
    expect(jsonLd).not.toHaveProperty("sameAs");
    expect(JSON.stringify(jsonLd)).not.toContain("localhost");
  });

  it("rejects a credentialed configured logo", () => {
    const jsonLd = createEducationalOrganizationJsonLd({
      ...settings,
      logo_url: "https://user:secret@assets.example/logo.png",
    });
    expect(jsonLd.logo).toBe(`${APPROVED_PRODUCTION_SITE_URL}/branding/prism-logo.png`);
  });
});
