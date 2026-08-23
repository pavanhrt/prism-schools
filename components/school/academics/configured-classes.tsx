import { CheckCircle2, School } from "lucide-react";
import type { SchoolClass } from "@/types/academic";

export function ConfiguredClasses({ classes }: { classes: SchoolClass[] }) {
  return (
    <section id="configured-classes" className="scroll-mt-24 bg-prism-navy py-20 text-white sm:py-24 lg:py-28" aria-labelledby="configured-classes-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-prism-gold/25 bg-prism-gold/10 text-prism-gold"><School className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" /></span>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">Live school data</p>
            <h2 id="configured-classes-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Currently configured classes</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/68">This list reflects the classes currently configured in the School OS academic setup. It is intentionally separate from the broader learning-stage model above.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.15)] sm:p-7">
            {classes.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2" aria-label="Currently configured classes">
                {classes.map((schoolClass) => <li key={schoolClass.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-sm font-medium text-white/90"><CheckCircle2 className="h-4 w-4 shrink-0 text-prism-gold" strokeWidth={1.8} aria-hidden="true" /><span className="break-words">{schoolClass.name}</span></li>)}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 px-5 py-10 text-center"><p className="text-base font-semibold text-white">Class availability is being confirmed.</p><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/60">Please contact our admissions team for the current class offering and availability.</p></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
