import { Bot, Boxes, BrainCircuit, Code2, Layers3, Lightbulb } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";

const environments = [
  { name: "AI Learning", description: "Explore intelligent systems, patterns and responsible uses of emerging technology.", Icon: BrainCircuit },
  { name: "Robotics", description: "Design, assemble and test mechanisms that turn ideas into movement.", Icon: Bot },
  { name: "Coding", description: "Build logical thinking through code, digital problem solving and creation.", Icon: Code2 },
  { name: "Innovation", description: "Develop ideas through questions, prototypes, feedback and iteration.", Icon: Lightbulb },
  { name: "Maker Experiences", description: "Learn through hands-on construction, materials and collaborative projects.", Icon: Boxes },
  { name: "Digital Creativity", description: "Combine visual thinking, storytelling and technology to communicate ideas.", Icon: Layers3 },
];

export function TechnologyExperiences() {
  return (
    <section id="technology" className="technology-section overflow-hidden py-20 sm:py-24 lg:py-32" aria-labelledby="technology-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading titleId="technology-title" eyebrow="Ideas into action" title="Where Ideas Become Reality" description="From coding and artificial intelligence to robotics and creative technology, students get opportunities to explore the tools shaping the future." inverse />
            <p className="mt-6 border-l border-prism-gold/60 pl-4 text-sm leading-7 text-slate-300">
              Future-focused learning experiences designed to help students explore emerging technologies through practical, creative and hands-on learning.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {environments.map(({ name, description, Icon }, index) => (
              <article key={name} className="technology-tile group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-prism-gold/25 bg-prism-gold/10 text-prism-gold">
                    <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[0.65rem] text-slate-500">0{index + 1}</span>
                </div>
                <h3 className="mt-10 text-xl font-semibold text-white">{name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
