import { Compass, Target } from "lucide-react";

export function VisionMission() {
  return (
    <section className="relative overflow-hidden bg-prism-navy py-20 text-white sm:py-24 lg:py-28" aria-labelledby="direction-title">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">Our direction</p>
          <h2 id="direction-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">Purpose gives learning momentum</h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm sm:p-9">
            <Compass className="h-7 w-7 text-prism-gold" aria-hidden="true" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-prism-gold">Vision</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Learners ready to thrive</h3>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">To nurture curious, capable, and confident learners who are prepared to thrive, contribute, and lead in a rapidly changing world.</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm sm:p-9">
            <Target className="h-7 w-7 text-prism-gold" aria-hidden="true" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-prism-gold">Mission</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Foundations meet possibility</h3>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">To combine strong academic foundations with creativity, technology, practical learning, and human values.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
