import Link from "next/link";

const STEPS = [
  { word: "Explore", note: "Ask better questions" },
  { word: "Create", note: "Imagine new possibilities" },
  { word: "Build", note: "Turn ideas into action" },
  { word: "Solve", note: "Think with purpose" },
  { word: "Lead", note: "Move forward together" },
];

export function PrismPath() {
  return (
    <section className="bg-prism-bg py-20 sm:py-24 lg:py-28" aria-labelledby="path-title">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold-ink">The PRISM philosophy</p>
          <h2 id="path-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-prism-navy sm:text-4xl lg:text-5xl">From curiosity to contribution</h2>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">A simple progression that encourages every learner to move from discovery to meaningful action.</p>
        </div>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.word} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform motion-safe:hover:-translate-y-1">
              <span className="text-xs font-semibold tabular-nums text-prism-gold-ink">0{index + 1}</span>
              <h3 className="mt-8 text-xl font-semibold uppercase tracking-[0.08em] text-prism-navy">{step.word}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.note}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 rounded-2xl border border-prism-gold/25 bg-white px-6 py-8 text-center sm:px-10 sm:py-10">
          <h2 className="text-2xl font-semibold tracking-tight text-prism-navy sm:text-3xl">See how this philosophy comes to life</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Explore the academic approach and learning experiences that shape a PRISM education.</p>
          <Link href="/academics" className="mt-7 inline-flex rounded-md bg-prism-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2">Discover learning at PRISM</Link>
        </div>
      </div>
    </section>
  );
}
