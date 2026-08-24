import { GalleryHero } from "@/components/school/gallery/gallery-hero";
import { GalleryPlaceholder } from "@/components/school/gallery/gallery-placeholder";
import { GalleryGrid } from "@/components/school/gallery/gallery-grid";
import { getPublicPageMetadata } from "@/features/public/metadata";
import { getPublicGalleryItems } from "@/features/public/service";

export const generateMetadata = () => getPublicPageMetadata("gallery");

export default async function GalleryPage() {
  const items = await getPublicGalleryItems();
  return (
    <div className="overflow-hidden bg-white">
      <GalleryHero />
      {items.length ? <GalleryGrid items={items} /> : <GalleryPlaceholder />}
    </div>
  );
}
