import Link from "next/link";
import { PRISM_SCHOOL_NAME, PRISM_TAGLINE } from "@/components/school/brand";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-prism-bg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-prism-navy via-prism-gold to-prism-navy" />
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-5 py-20 sm:py-28">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-navy">
            {PRISM_TAGLINE}
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-prism-navy sm:text-5xl">
            {PRISM_SCHOOL_NAME}
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Strong academic foundations, thoughtful innovation, and a community where every
            student can learn, grow, and belong.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admissions"
              className="rounded-md bg-prism-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2"
            >
              Enquire about admissions
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-prism-navy transition-colors hover:border-prism-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-16 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-prism-navy">Academics</h2>
            <p className="mt-2 text-sm text-slate-600">
              A structured curriculum from early years through to graduation, with dedicated
              subject teachers at every level.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-prism-navy">Admissions</h2>
            <p className="mt-2 text-sm text-slate-600">
              A straightforward path from enquiry to enrollment — reach out and our
              admissions team will guide you through it.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-prism-navy">Community</h2>
            <p className="mt-2 text-sm text-slate-600">
              Regular notices, events, and open communication between school and home.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
