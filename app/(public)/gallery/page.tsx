import type { Metadata } from "next";
import { GalleryHero } from "@/components/school/gallery/gallery-hero";
import { GalleryPlaceholder } from "@/components/school/gallery/gallery-placeholder";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A media-ready home for authentic moments of learning and school life at PRISM SCHOOLS.",
};

export default function GalleryPage() {
  return (
    <div className="overflow-hidden bg-white">
      <GalleryHero />
      <GalleryPlaceholder />
    </div>
  );
}
