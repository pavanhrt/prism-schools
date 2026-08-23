import { Bot, BrainCircuit, Lightbulb, Network } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";
import type { PublicWebsiteService } from "@/features/public/types";
import Image from "next/image";

const experiences = [
  { title: "AI & Technology", description: "Students explore artificial intelligence, digital tools, coding and emerging technologies through practical learning experiences.", Icon: BrainCircuit, visual: "network", image: null },
  { title: "Robotics & Makers", description: "Students turn ideas into working creations by designing, building and experimenting with robotics and technology.", Icon: Bot, visual: "mechanical", image: null },
  { title: "Creative Thinking", description: "We encourage students to question, imagine, experiment and create solutions instead of simply memorizing answers.", Icon: Lightbulb, visual: "creative", image: null },
  { title: "Real-World Skills", description: "Students apply classroom knowledge to projects, challenges and practical situations that prepare them for the real world.", Icon: Network, visual: "systems", image: null },
];

const icons = { bot: Bot, brain: BrainCircuit, lightbulb: Lightbulb, network: Network };
const serviceIcons = { "ai-and-technology": BrainCircuit, "robotics-and-makers": Bot, "creative-thinking": Lightbulb, "real-world-skills": Network };

export function BeyondTextbooks({ services }: { services: PublicWebsiteService[] }) {
  const visibleExperiences = services.length ? services.map((service) => ({
    title: service.title,
    description: service.short_description || service.description || "",
    Icon: icons[(service.icon || "").toLowerCase() as keyof typeof icons] || serviceIcons[service.slug as keyof typeof serviceIcons] || Network,
    visual: service.visual_type || "systems",
    image: service.visual_asset_url,
  })) : experiences;
  return (
    <section id="future-learning" className="future-learning-section overflow-hidden py-20 sm:py-24 lg:py-32" aria-labelledby="future-learning-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div>
          <SectionHeading titleId="future-learning-title" eyebrow="Learning beyond the expected" title="Beyond Textbooks" description="We don't just teach students what to learn. We teach them how to think, create, build and solve." inverse />
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:mt-18">
          {visibleExperiences.map(({ title, description, Icon, visual, image }, index) => (
            <article key={title} className="future-experience relative min-h-[25rem] overflow-hidden bg-prism-navy p-7 sm:p-9 lg:p-11">
              {image && <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-25" />}
              <div className={`future-experience__visual future-experience__visual--${visual} ${image ? "opacity-30" : ""}`} aria-hidden="true">
                <span /><span /><span /><span />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">0{index + 1}</span>
                  <Icon className="h-6 w-6 text-prism-gold" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="mt-40 max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
