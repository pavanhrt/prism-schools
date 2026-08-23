import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AcademicHero } from "@/components/school/academics/academic-hero";
import { AcademicStages } from "@/components/school/academics/academic-stages";
import { LearningApproach } from "@/components/school/academics/learning-approach";
import { getPublicSchoolWebsiteConfig } from "@/features/public/service";

export const metadata: Metadata = {
  title: "Academics",
  description: "Explore the PRISM academic approach: strong foundations, purposeful learning and future-ready capabilities.",
};

export default async function AcademicsPage() {
  const { programs } = await getPublicSchoolWebsiteConfig();
  return (
    <div className="overflow-hidden bg-white">
      <AcademicHero />
      <AcademicStages programs={programs} />
      <LearningApproach />
      <section className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-prism-navy px-6 py-12 text-white shadow-[0_30px_80px_rgba(7,26,61,0.16)] sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14">
          <div aria-hidden="true" className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-prism-gold/20 bg-prism-gold/[0.06]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">Continue the conversation</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Find the right next step for your child.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">Talk with our admissions team about PRISM&apos;s learning approach and the right next step for your child.</p>
          </div>
          <Link href="/admissions" className="relative mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-prism-gold px-6 py-3 text-sm font-semibold text-prism-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy lg:mt-0 lg:shrink-0">
            Explore admissions <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
