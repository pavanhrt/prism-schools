import type { Metadata } from "next";
import { AboutHero } from "@/components/school/about/about-hero";
import { Philosophy } from "@/components/school/about/philosophy";
import { PrismPath } from "@/components/school/about/prism-path";
import { VisionMission } from "@/components/school/about/vision-mission";

export const metadata: Metadata = {
  title: "About PRISM SCHOOLS",
  description:
    "Discover the philosophy, vision, and mission behind PRISM SCHOOLS — strong academic foundations shaped for a changing world.",
};

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
