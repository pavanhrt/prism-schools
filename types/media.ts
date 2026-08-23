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

export type PublicMediaUsageKind = "branding" | "hero" | "program" | "future-learning" | "gallery" | "seo";

export interface PublicMediaUsage {
  kind: PublicMediaUsageKind;
  label: string;
  entityId: string | null;
}

export interface PublicMediaAsset {
  path: string;
  url: string;
  filename: string;
  extension: "jpg" | "png" | "webp" | "avif" | "ico";
  category: PublicMediaUsageKind;
  size: number | null;
  createdAt: string | null;
  usages: PublicMediaUsage[];
  isUnused: boolean;
}

export interface PublicMediaLibrary {
  assets: PublicMediaAsset[];
  truncated: boolean;
}

export interface MediaCleanupResult {
  databaseDeleted: boolean;
  storageDeleted: boolean;
  storageRetainedBecauseUsed: boolean;
  cleanupWarning?: string;
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
