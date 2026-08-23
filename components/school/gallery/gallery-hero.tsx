import { Aperture } from "lucide-react";

export function GalleryHero() {
  return (
    <section className="relative isolate overflow-hidden bg-prism-navy text-white">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_75%_50%,black,transparent_66%)]" />
        <div className="absolute -right-28 top-8 size-96 rounded-full border border-white/10" />
        <div className="absolute -right-12 top-24 size-64 rounded-full border border-prism-gold/25" />
        <div className="absolute right-20 top-44 size-24 rounded-full bg-prism-gold/10 blur-2xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center lg:px-12 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-prism-gold">Gallery</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-7xl">
            Life at PRISM, through its own lens
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            A future home for authentic moments of learning, making, exploring and growing—shared with care as original school media becomes available.
          </p>
        </div>

        <div aria-hidden="true" className="relative mx-auto aspect-[4/3] w-full max-w-sm">
          <div className="absolute left-0 top-8 h-[72%] w-[70%] -rotate-6 rounded-2xl border border-white/15 bg-white/[0.04] shadow-2xl" />
          <div className="absolute bottom-4 right-0 h-[72%] w-[70%] rotate-6 rounded-2xl border border-prism-gold/25 bg-white/[0.06] shadow-2xl" />
          <div className="absolute inset-[16%] flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-prism-navy-light/80 backdrop-blur-sm">
            <Aperture className="size-12 text-prism-gold" strokeWidth={1.25} />
            <span className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-300">Original stories only</span>
          </div>
        </div>
      </div>
    </section>
  );
}
