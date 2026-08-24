import { AboutHero } from "@/components/school/about/about-hero";
import { Philosophy } from "@/components/school/about/philosophy";
import { PrismPath } from "@/components/school/about/prism-path";
import { VisionMission } from "@/components/school/about/vision-mission";
import { getPublicPageMetadata } from "@/features/public/metadata";

export const generateMetadata = () => getPublicPageMetadata("about");

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-white">
      <AboutHero />
      <Philosophy />
      <VisionMission />
      <PrismPath />
    </div>
  );
}
