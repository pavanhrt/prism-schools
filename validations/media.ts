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
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;
export type GalleryItemUpdateInput = z.infer<typeof galleryItemUpdateSchema>;
