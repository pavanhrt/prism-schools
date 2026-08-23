import type { Metadata } from "next";
import { GalleryHero } from "@/components/school/gallery/gallery-hero";
import { GalleryPlaceholder } from "@/components/school/gallery/gallery-placeholder";
import { GalleryGrid } from "@/components/school/gallery/gallery-grid";
import { getPublicGalleryItems } from "@/features/public/service";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A media-ready home for authentic moments of learning and school life at PRISM SCHOOLS.",
};

export default async function GalleryPage() {
  const items = await getPublicGalleryItems();
  return (
    <div className="overflow-hidden bg-white">
      <GalleryHero />
      {items.length ? <GalleryGrid items={items} /> : <GalleryPlaceholder />}
    </div>
  );
}
