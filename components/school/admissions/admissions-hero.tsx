import { ArrowDown, MessageCircleMore, ShieldCheck } from "lucide-react";

export function AdmissionsHero() {
  return (
    <section className="relative isolate overflow-hidden bg-prism-navy text-white">
      <div aria-hidden="true" className="absolute inset-0 opacity-70">
        <div className="absolute -right-24 top-12 h-80 w-80 rounded-full bg-prism-gold/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute right-[12%] top-0 h-full w-px rotate-[18deg] bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:px-12 lg:py-28">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-prism-gold">
            Admissions at PRISM
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-7xl">
            Begin Your Child&apos;s PRISM Journey
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Discover a learning environment where strong academics meet curiosity,
            creativity, technology and future-ready skills.
          </p>
          <a
            href="#enquiry"
            className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-prism-gold px-6 py-3 text-sm font-semibold text-prism-navy transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy"
          >
            Enquire About Admissions
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </div>

        <aside className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm" aria-label="Admissions support">
          <MessageCircleMore aria-hidden="true" className="size-7 text-prism-gold" />
          <p className="mt-5 text-lg font-semibold">A clear first step</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Share a few details below. Our admissions team will follow up and guide
            you through the next appropriate step.
          </p>
          <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-prism-gold" />
            <span>Your enquiry is submitted securely to the school team.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
