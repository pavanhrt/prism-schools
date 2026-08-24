import Link from "next/link";

export function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden bg-prism-bg" aria-labelledby="about-title">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -right-32 top-12 h-80 w-80 rounded-full border border-prism-gold/20 sm:h-[30rem] sm:w-[30rem]" />
        <div className="absolute -right-12 top-32 h-56 w-56 rotate-12 border border-prism-navy/10 sm:h-80 sm:w-80" />
        <div className="absolute right-16 top-40 h-40 w-40 rotate-45 bg-white/75 shadow-[0_2rem_6rem_rgba(7,26,61,0.08)] sm:right-32 sm:h-56 sm:w-56" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-prism-gold/45 to-transparent" />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:py-32">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold-ink">About PRISM SCHOOLS</p>
          <h1 id="about-title" className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-prism-navy sm:text-5xl lg:text-6xl">A Modern Legacy of Learning</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">Strong academic foundations. Future-ready thinking. A learning environment designed to help students explore, create, build, solve, and lead.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/academics" className="rounded-md bg-prism-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2">Explore academics</Link>
            <Link href="/admissions" className="rounded-md border border-prism-navy/20 bg-white px-5 py-3 text-sm font-semibold text-prism-navy transition-colors hover:border-prism-gold hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2">Begin the journey</Link>
          </div>
        </div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-sm items-center justify-center lg:flex" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-prism-navy/10" />
          <div className="absolute inset-[14%] rotate-45 rounded-[2.5rem] border border-prism-gold/35" />
          <div className="absolute inset-[28%] rotate-12 rounded-3xl bg-prism-navy shadow-[0_2rem_5rem_rgba(7,26,61,0.22)]" />
          <div className="relative h-20 w-20 rotate-45 border border-prism-gold bg-white/95" />
        </div>
      </div>
    </section>
  );
}
