import { HeroBanner } from "@/components/school/hero/hero-banner";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroBanner />

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
