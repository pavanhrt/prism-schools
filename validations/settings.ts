import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");
const displayOrder = z.coerce.number().int().min(0).max(10000);
const optionalExternalUrl = z.string().trim().max(2048).refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Enter a valid http(s) URL").optional();
const optionalAssetPath = z.string().trim().max(2048).refine((v) => v === "" || v.startsWith("/") || /^https?:\/\/[^\s]+$/i.test(v), "Enter an internal path or http(s) URL").optional();
const ctaUrl = z.string().trim().min(1).max(2048).refine((v) => /^\/(?!\/)[^\s]*$/.test(v) || /^https?:\/\/[^\s]+$/i.test(v), "Enter an internal path or http(s) URL");

export const schoolSettingsUpdateSchema = z.object({
  school_name: requiredText(150).optional(), short_name: optionalText(50), tagline: requiredText(200).optional(), description: optionalText(2000),
  logo_url: optionalAssetPath, favicon_url: optionalAssetPath,
  primary_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color").optional(), secondary_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color").optional(), accent_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color").optional(),
  hero_eyebrow: requiredText(150).optional(), hero_tagline: requiredText(200).optional(), hero_title: requiredText(200).optional(), hero_description: requiredText(1000).optional(),
  hero_primary_cta_label: requiredText(80).optional(), hero_primary_cta_url: ctaUrl.optional(), hero_secondary_cta_label: requiredText(80).optional(), hero_secondary_cta_url: ctaUrl.optional(), hero_image_url: optionalAssetPath,
  contact_email: z.string().trim().max(254).refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email").optional(), contact_phone: optionalText(40), website_url: optionalExternalUrl,
  address_line: optionalText(300), city: optionalText(100), district: optionalText(100), state: optionalText(100), country: optionalText(100), postal_code: optionalText(20), google_maps_url: optionalExternalUrl,
  facebook_url: optionalExternalUrl, instagram_url: optionalExternalUrl, youtube_url: optionalExternalUrl, linkedin_url: optionalExternalUrl,
  seo_title: optionalText(70), seo_description: optionalText(180), og_image_url: optionalAssetPath,
}).refine((value) => Object.keys(value).length > 0, "Provide at least one setting");

export const websiteProgramSchema = z.object({ title: requiredText(120), slug, level: optionalText(100), headline: optionalText(200), short_description: optionalText(500), description: optionalText(3000), icon: optionalText(80), image_url: optionalAssetPath, display_order: displayOrder, is_active: z.boolean() });
export const websiteServiceSchema = z.object({ title: requiredText(120), slug, short_description: optionalText(500), description: optionalText(3000), icon: optionalText(80), visual_type: optionalText(80), visual_asset_url: optionalAssetPath, display_order: displayOrder, is_active: z.boolean() });
export const websiteFeatureSchema = z.object({ title: requiredText(120), description: requiredText(1000), icon: optionalText(80), display_order: displayOrder, is_active: z.boolean() });
export const websiteRecordIdSchema = z.string().uuid();
export const websiteCollectionSchema = z.enum(["programs", "services", "features", "gallery"]);
export const websiteReorderSchema = z.object({
  collection: websiteCollectionSchema,
  id: websiteRecordIdSchema,
  direction: z.enum(["up", "down"]),
});
export type SchoolSettingsUpdateInput = z.infer<typeof schoolSettingsUpdateSchema>;
export type WebsiteProgramInput = z.infer<typeof websiteProgramSchema>;
export type WebsiteServiceInput = z.infer<typeof websiteServiceSchema>;
export type WebsiteFeatureInput = z.infer<typeof websiteFeatureSchema>;
