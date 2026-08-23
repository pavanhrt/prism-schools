import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const entityIdSchema = z.string().uuid();
export const galleryItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  caption: optionalText(500),
  category: optionalText(80),
  alt_text: z.string().trim().min(3).max(200),
  display_order: z.coerce.number().int().min(0).max(10_000).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const galleryItemUpdateSchema = galleryItemSchema.partial();
export const galleryItemIdSchema = z.string().uuid();
export const managedPublicMediaPathSchema = z.string().trim().max(300).refine(
  (value) => /^(?:branding\/(?:logo|og)\/[0-9a-f-]+\.(?:jpg|png|webp|avif)|branding\/favicon\/[0-9a-f-]+\.(?:jpg|png|webp|avif|ico)|hero\/[0-9a-f-]+\.(?:jpg|png|webp|avif)|programs\/[0-9a-f-]+\/[0-9a-f-]+\.(?:jpg|png|webp|avif)|services\/[0-9a-f-]+\/[0-9a-f-]+\.(?:jpg|png|webp|avif)|gallery\/[0-9a-f-]+\.(?:jpg|png|webp|avif))$/.test(value),
  "Choose a managed public image.",
);
export const publicMediaReuseSchema = z.object({
  path: managedPublicMediaPathSchema,
  category: z.enum(["branding-logo", "branding-favicon", "hero", "og-image", "program", "service"]),
  entityId: entityIdSchema.nullable(),
});
export const galleryReuseSchema = galleryItemSchema.extend({ path: managedPublicMediaPathSchema });
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;
export type GalleryItemUpdateInput = z.infer<typeof galleryItemUpdateSchema>;
export type PublicMediaReuseInput = z.infer<typeof publicMediaReuseSchema>;
