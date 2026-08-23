import { HeroBanner } from "@/components/school/hero/hero-banner";
import { BeyondTextbooks } from "@/components/school/home/beyond-textbooks";
import { FutureReady } from "@/components/school/home/future-ready";
import { LearningJourney } from "@/components/school/home/learning-journey";
import { LearningStages } from "@/components/school/home/learning-stages";
import { ParentMessage } from "@/components/school/home/parent-message";
import { TechnologyExperiences } from "@/components/school/home/technology-experiences";
import { WhyPrism } from "@/components/school/home/why-prism";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroBanner />
      <LearningStages />
      <BeyondTextbooks />
      <FutureReady />
      <LearningJourney />
      <TechnologyExperiences />
      <WhyPrism />
      <ParentMessage />
    </div>
  );
}
