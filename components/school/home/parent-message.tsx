import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ParentMessage() {
  return (
    <section className="parent-message overflow-hidden bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="parent-message-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="parent-message__panel relative overflow-hidden rounded-3xl bg-prism-navy px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="parent-message__orb" aria-hidden="true" />
          <div className="relative z-10 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">For parents</p>
            <h2 id="parent-message-title" className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              A School for the World Your Child Will Enter
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              The careers of tomorrow may not look like the careers of today. That is why we focus on building adaptable, curious and confident learners who can continuously learn, create and grow.
            </p>
            <Link href="/about" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-prism-gold px-6 py-3 text-sm font-semibold text-prism-navy transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#d7b43c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">
              Explore Our Approach <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
