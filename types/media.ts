export const PUBLIC_MEDIA_BUCKET = "public-school-media" as const;
export const PRIVATE_MEDIA_BUCKET = "private-school-files" as const;

export type PublicMediaCategory =
  | "branding-logo"
  | "branding-favicon"
  | "hero"
  | "og-image"
  | "program"
  | "service"
  | "gallery";

export interface StoredMedia {
  bucket: typeof PUBLIC_MEDIA_BUCKET | typeof PRIVATE_MEDIA_BUCKET;
  path: string;
  url: string | null;
}

export interface WebsiteGalleryItem {
  id: string;
  title: string;
  caption: string | null;
  category: string | null;
  storage_path: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
