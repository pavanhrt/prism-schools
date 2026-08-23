import { Beaker, Brain, Lightbulb, MessageSquareText, RefreshCcw, Wrench } from "lucide-react";

const steps = [
  { label: "Understand", detail: "Build clear concepts and meaningful connections.", Icon: Brain },
  { label: "Apply", detail: "Use knowledge in purposeful, real contexts.", Icon: Wrench },
  { label: "Experiment", detail: "Test ideas, observe and learn through inquiry.", Icon: Beaker },
  { label: "Create", detail: "Turn understanding into original work and solutions.", Icon: Lightbulb },
  { label: "Present", detail: "Share thinking clearly, thoughtfully and confidently.", Icon: MessageSquareText },
  { label: "Reflect", detail: "Review progress and improve with intention.", Icon: RefreshCcw },
];

export function LearningApproach() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-20 sm:py-24 lg:py-28" aria-labelledby="learning-approach-title">
      <div aria-hidden="true" className="absolute -right-32 top-20 -z-10 h-96 w-96 rounded-full bg-prism-gold/[0.07] blur-3xl" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">Learning approach</p>
          <h2 id="learning-approach-title" className="mt-4 text-3xl font-semibold tracking-tight text-prism-navy sm:text-4xl">Beyond remembering. Toward understanding.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">Academic learning becomes lasting capability when students have opportunities to think, use, test, make, communicate and improve.</p>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {steps.map(({ label, detail, Icon }, index) => (
            <li key={label} className="group min-w-0 bg-white p-6 transition hover:bg-prism-bg sm:p-8">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-prism-navy text-prism-gold"><Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" /></span><span className="text-xs font-semibold text-slate-400">0{index + 1}</span></div>
              <h3 className="mt-8 text-lg font-semibold text-prism-navy">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
