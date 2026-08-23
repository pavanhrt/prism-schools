const principles = ["Explore", "Create", "Build", "Solve", "Lead"];

export function FutureReady() {
  return (
    <section className="future-ready-section overflow-hidden py-20 sm:py-24 lg:py-32" aria-labelledby="future-ready-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">The PRISM philosophy</p>
            <h2 id="future-ready-title" className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-prism-navy sm:text-5xl lg:text-6xl">
              Don&apos;t Just Prepare for the Future. <span className="text-prism-navy-light">Build It.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            The world is changing faster than ever. Our students need more than textbooks. They need curiosity, creativity, technology, confidence and the ability to solve real problems.
          </p>
        </div>

        <ol className="principle-path mt-14 grid grid-cols-2 gap-y-8 border-t border-slate-300 pt-8 sm:grid-cols-5 lg:mt-20" aria-label="PRISM learning philosophy">
          {principles.map((principle, index) => (
            <li key={principle} className="principle-path__item relative pr-4">
              <span className="font-mono text-[0.65rem] text-slate-400">0{index + 1}</span>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-prism-navy sm:text-base">{principle}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
