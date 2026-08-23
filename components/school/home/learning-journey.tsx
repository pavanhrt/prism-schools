import { Binoculars, CircleHelp, FlaskConical, Hammer, Lightbulb, MicVocal, Puzzle, Trophy } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";

const journey = [
  { label: "Ask", Icon: CircleHelp },
  { label: "Explore", Icon: Binoculars },
  { label: "Experiment", Icon: FlaskConical },
  { label: "Create", Icon: Lightbulb },
  { label: "Build", Icon: Hammer },
  { label: "Solve", Icon: Puzzle },
  { label: "Present", Icon: MicVocal },
  { label: "Lead", Icon: Trophy },
];

export function LearningJourney() {
  return (
    <section className="bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="journey-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div>
          <SectionHeading titleId="journey-title" eyebrow="Curiosity into capability" title="Learning by Doing" description="At PRISM, curiosity becomes action. Students move from asking thoughtful questions to exploring, experimenting, creating and sharing solutions with confidence." align="center" />
        </div>

        <ol className="learning-journey relative mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:mt-18 lg:grid-cols-8" aria-label="Learning by doing journey">
          {journey.map(({ label, Icon }, index) => (
            <li key={label} className="learning-journey__step relative flex flex-col items-center text-center">
              <span className="learning-journey__icon relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-prism-navy shadow-[0_8px_25px_rgba(7,26,61,0.08)]">
                <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="sr-only">Step {index + 1}: </span>
              <span className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-prism-navy">{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
