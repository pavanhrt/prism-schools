import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";
import type { PublicWebsiteProgram } from "@/features/public/types";
import Image from "next/image";

const stages = [
  {
    number: "01",
    level: "Pre-Primary",
    title: "Curiosity Starts Here",
    description: "Building confidence, curiosity, communication and foundational skills through play, exploration and discovery.",
    areas: ["Early Learning", "Activity-Based Learning", "Communication", "Creativity", "Social Skills", "Motor Development"],
    image: null,
  },
  {
    number: "02",
    level: "Primary School",
    title: "Building Strong Foundations",
    description: "Developing strong academic foundations while encouraging curiosity, problem solving, creativity and independent thinking.",
    areas: ["Mathematics", "Science", "Languages", "Technology", "Creative Activities", "Project-Based Learning"],
    image: null,
  },
  {
    number: "03",
    level: "Secondary School",
    title: "Preparing Students for Tomorrow",
    description: "Advanced academic learning combined with technology, innovation, leadership and real-world problem solving.",
    areas: ["Advanced Academics", "STEM", "Coding", "AI", "Robotics", "Research", "Leadership"],
    image: null,
  },
];

export function LearningStages({ programs }: { programs: PublicWebsiteProgram[] }) {
  const visibleStages = programs.map((program, index) => {
    const approved = stages.find((stage) => stage.level === program.title) || stages[index];
    return {
    number: String(index + 1).padStart(2, "0"),
    level: program.level || program.title,
    title: program.headline || program.title,
    description: program.short_description || program.description || "",
    areas: approved?.areas || [],
    image: program.image_url,
  }});
  const renderedStages = visibleStages.length ? visibleStages : stages;
  return (
    <section id="learning" className="overflow-hidden bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="learning-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div>
          <SectionHeading
            titleId="learning-title"
            eyebrow="Growing with every stage"
            title="Learning for Every Stage"
            description="PRISM combines age-appropriate academic development with curiosity, creativity and future-ready learning — from a child's first discoveries to confident secondary-school leadership."
          />
        </div>

        <div className="mt-12 border-y border-slate-200 lg:mt-16">
          {renderedStages.map((stage, index) => (
            <article key={stage.level} className="stage-row grid gap-7 py-9 sm:py-11 lg:grid-cols-[0.22fr_0.78fr_1.1fr] lg:gap-10 lg:py-12">
              <div className="flex items-start justify-between lg:block">
                <span className="font-mono text-xs text-slate-400">{stage.number}</span>
                <span className="stage-row__line mt-4 hidden h-px w-16 bg-prism-gold lg:block" aria-hidden="true" />
              </div>
              <div>
                {stage.image && <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl"><Image src={stage.image} alt={`${stage.level} at PRISM`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /></div>}
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">{stage.level}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-prism-navy sm:text-3xl">{stage.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{stage.description}</p>
                {index === 1 && (
                  <Link href="/academics" className="mt-5 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-prism-navy underline decoration-prism-gold/50 underline-offset-4 transition-colors hover:text-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy">
                    Explore academics <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-3 self-center sm:grid-cols-3" aria-label={`${stage.level} learning areas`}>
                {stage.areas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-prism-gold" aria-hidden="true" />
                    {area}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
