import { BookOpenCheck, Brain, Compass, Lightbulb, Presentation, Workflow } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";

const reasons = [
  { title: "Future Ready", description: "Students develop skills aligned with a rapidly changing world.", Icon: Compass },
  { title: "Technology Integrated", description: "Technology becomes a learning tool rather than just another subject.", Icon: Workflow },
  { title: "Learning by Doing", description: "Students experience concepts through projects and experimentation.", Icon: Presentation },
  { title: "Creative Thinking", description: "Questions, ideas and original solutions are encouraged.", Icon: Lightbulb },
  { title: "Strong Academics", description: "Future-focused learning starts with strong academic foundations.", Icon: BookOpenCheck },
  { title: "Leadership", description: "Students develop confidence, communication and leadership skills.", Icon: Brain },
];

export function WhyPrism() {
  return (
    <section className="bg-prism-bg py-20 sm:py-24 lg:py-32" aria-labelledby="why-prism-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div>
          <SectionHeading titleId="why-prism-title" eyebrow="A balanced education" title="Why PRISM?" description="Strong academics are the foundation. Future-ready skills, creativity and confidence help students carry that foundation into a changing world." />
        </div>
        <div className="mt-14 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ title, description, Icon }) => (
            <article key={title} className="group border-b border-r border-slate-200 bg-white/60 p-7 transition-colors hover:bg-white sm:p-9">
              <Icon className="h-6 w-6 text-prism-gold" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-8 text-xl font-semibold text-prism-navy">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
