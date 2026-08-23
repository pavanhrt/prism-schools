import { Blocks, Languages, Microscope } from "lucide-react";
import type { PublicWebsiteProgram } from "@/features/public/types";

const stages = [
  { number: "01", title: "Pre-Primary", summary: "A welcoming beginning shaped by curiosity, communication, movement, play and discovery.", themes: ["Curiosity", "Communication", "Movement", "Play", "Discovery"], Icon: Blocks },
  { number: "02", title: "Primary School", summary: "Strong foundations grow through connected learning, creative expression and early technology awareness.", themes: ["Mathematics", "Science", "Languages", "Social understanding", "Creativity", "Technology awareness"], Icon: Languages },
  { number: "03", title: "Secondary School", summary: "Advanced academics are paired with the thinking and leadership capabilities learners need for what comes next.", themes: ["STEM", "Critical thinking", "Coding", "Technology", "Research", "Leadership"], Icon: Microscope },
];

const icons = [Blocks, Languages, Microscope];

export function AcademicStages({ programs }: { programs: PublicWebsiteProgram[] }) {
  const visibleStages = programs.length ? programs.map((program, index) => {
    const approved = stages.find((stage) => stage.title === program.title) || stages[index];
    return {
    number: String(index + 1).padStart(2, "0"),
    title: program.title,
    summary: program.short_description || program.description || "",
    themes: approved?.themes || [],
    Icon: approved?.Icon || icons[index % icons.length],
  }}) : stages;
  return (
    <section id="academic-structure" className="scroll-mt-24 bg-prism-bg py-20 sm:py-24 lg:py-28" aria-labelledby="academic-structure-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">Academic model</p>
            <h2 id="academic-structure-title" className="mt-4 text-3xl font-semibold tracking-tight text-prism-navy sm:text-4xl">Learning that grows with the learner.</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 lg:pt-7">Each stage has a distinct purpose: begin with wonder, strengthen essential foundations and progress toward deeper inquiry, independence and leadership. Together, these stages describe PRISM&apos;s approved high-level educational approach.</p>
        </div>
        <ol className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-3">
          {visibleStages.map(({ number, title, summary, themes, Icon }) => (
            <li key={title} className="group flex min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(7,26,61,0.06)] transition hover:-translate-y-1 hover:border-prism-gold/40 hover:shadow-[0_24px_60px_rgba(7,26,61,0.1)] sm:p-8">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-[0.2em] text-slate-400">{number}</span><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-prism-navy text-prism-gold transition group-hover:bg-prism-navy-light"><Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" /></span></div>
              <h3 className="mt-8 text-2xl font-semibold text-prism-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{summary}</p>
              <ul className="mt-7 flex flex-wrap gap-2" aria-label={`${title} learning themes`}>
                {themes.map((theme) => <li key={theme} className="rounded-full border border-slate-200 bg-prism-bg px-3 py-1.5 text-xs font-medium text-slate-600">{theme}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
