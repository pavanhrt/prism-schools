import Link from "next/link";
import { ArrowDown, Atom, Binary, BookOpen } from "lucide-react";

export function AcademicHero() {
  return (
    <section className="relative isolate overflow-hidden bg-prism-navy text-white" aria-labelledby="academics-title">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_24%,rgba(201,162,39,0.16),transparent_24rem),linear-gradient(145deg,#071a3d,#081f48_60%,#0b2a5b)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_right,transparent,black_60%,transparent)]" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-prism-gold">Academics at PRISM</p>
          <h1 id="academics-title" className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Strong Foundations.<span className="block text-white/70">Future-Ready Learning.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">A thoughtful academic model that builds essential knowledge while helping learners question, apply, create and communicate with confidence.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#academic-structure" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-prism-gold px-6 py-3 text-sm font-semibold text-prism-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">Explore our approach <ArrowDown className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
          <div className="absolute -inset-10 rounded-full border border-prism-gold/15" />
          <div className="relative grid min-h-80 grid-cols-2 gap-3 rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:min-h-96 sm:p-5">
            <div className="flex flex-col justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-5 sm:p-6"><BookOpen className="h-7 w-7 text-prism-gold" strokeWidth={1.5} /><span className="text-sm font-medium text-white/75">Knowledge</span></div>
            <div className="flex translate-y-8 flex-col justify-between rounded-[1.4rem] border border-prism-gold/25 bg-prism-gold/[0.08] p-5 sm:p-6"><Atom className="h-7 w-7 text-prism-gold" strokeWidth={1.5} /><span className="text-sm font-medium text-white/75">Discovery</span></div>
            <div className="flex -translate-y-2 flex-col justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-5 sm:p-6"><Binary className="h-7 w-7 text-prism-gold" strokeWidth={1.5} /><span className="text-sm font-medium text-white/75">Capability</span></div>
            <div className="flex translate-y-6 items-end rounded-[1.4rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-5 sm:p-6"><span className="text-4xl font-semibold text-white/20 sm:text-5xl">01—03</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
