import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroVisual } from "@/components/school/hero/hero-visual";
import type { PublicSchoolSettings } from "@/features/public/types";
import Image from "next/image";

export function HeroBanner({ settings }: { settings: PublicSchoolSettings }) {
  const title = settings.hero_title || "Where Learning Meets the Future";
  const titleParts = title.split(/\s+/);
  const titleEnd = titleParts.pop();
  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <div className="hero-banner__glow" aria-hidden="true" />
      <div className="hero-banner__grid mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[43rem] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-10 lg:py-24 xl:gap-14 2xl:min-h-[50rem] 2xl:max-w-[100rem]">
        <div className="hero-copy relative z-10 max-w-3xl">
          <div className="hero-reveal hero-reveal--one flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">
              {settings.hero_eyebrow || settings.school_name}
            </span>
            <span className="hidden h-px w-8 bg-prism-gold/60 sm:block" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
              {settings.hero_tagline || settings.tagline}
            </span>
          </div>

          <h1
            id="hero-title"
            className="hero-reveal hero-reveal--two mt-6 max-w-4xl text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-[5rem]"
          >
            {titleParts.join(" ")} <span className="text-prism-gold">{titleEnd}</span>
          </h1>

          <p className="hero-reveal hero-reveal--three mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            {settings.hero_description}
          </p>

          <div className="hero-reveal hero-reveal--four mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={settings.hero_primary_cta_url || "/about"}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-prism-gold px-6 py-3 text-sm font-semibold text-prism-navy shadow-[0_12px_30px_rgba(201,162,39,0.18)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-[#d7b43c] hover:shadow-[0_16px_36px_rgba(201,162,39,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy"
            >
              {settings.hero_primary_cta_label || "Explore Our School"}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href={settings.hero_secondary_cta_url || "/academics"}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/35 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy"
            >
              {settings.hero_secondary_cta_label || "Discover Future Learning"}
            </Link>
          </div>

          <div className="hero-reveal hero-reveal--five mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
            <span>Explore</span>
            <span>Create</span>
            <span>Build</span>
            <span>Lead</span>
            <span>Belong</span>
          </div>
        </div>

        <div className="2xl:scale-110">
          {settings.hero_image_url ? <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl sm:min-h-[28rem]"><Image src={settings.hero_image_url} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" preload /></div> : <HeroVisual />}
        </div>
      </div>
    </section>
  );
}
