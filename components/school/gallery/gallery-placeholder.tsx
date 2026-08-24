import { Camera, Focus, Sparkles } from "lucide-react";

const futureLenses = [
  { title: "Learning", detail: "Classroom and project moments", mark: "01" },
  { title: "Creativity", detail: "Ideas taking visible form", mark: "02" },
  { title: "Technology", detail: "Thoughtful tools in practice", mark: "03" },
  { title: "Community", detail: "Shared experiences and connection", mark: "04" },
] as const;

export function GalleryPlaceholder() {
  return (
    <>
      <section aria-labelledby="gallery-status-title" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-prism-bg lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-prism-navy text-white">
                <Camera aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold-ink">A considered beginning</p>
              <h2 id="gallery-status-title" className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-prism-navy sm:text-4xl lg:text-5xl">
                The best school stories are real ones
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                We are preparing this space for genuine PRISM photography rather than filling it with generic imagery. As verified media is curated, this gallery will grow into a visual record of everyday learning and school life.
              </p>
            </div>

            <div aria-hidden="true" className="relative min-h-72 overflow-hidden border-t border-slate-200 bg-prism-navy lg:min-h-full lg:border-l lg:border-t-0">
              <div className="absolute inset-6 rounded-2xl border border-dashed border-white/20" />
              <div className="absolute left-[14%] top-[18%] h-[44%] w-[54%] -rotate-3 rounded-xl border border-white/15 bg-white/[0.04]" />
              <div className="absolute bottom-[14%] right-[12%] h-[44%] w-[54%] rotate-3 rounded-xl border border-prism-gold/25 bg-white/[0.05]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Focus className="size-16 text-prism-gold/75" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="future-gallery-title" className="bg-prism-bg py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold-ink">The collection ahead</p>
            <h2 id="future-gallery-title" className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-prism-navy sm:text-4xl lg:text-5xl">
              Stories this space is designed to hold
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              As our school community grows, this space will bring together authentic moments of learning, creativity, technology and community life at PRISM.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {futureLenses.map((lens) => (
              <li key={lens.title} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-prism-gold/50 hover:shadow-lg hover:shadow-prism-navy/5">
                <div className="flex items-center justify-between">
                  <Sparkles aria-hidden="true" className="size-5 text-prism-gold" />
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-400">{lens.mark}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-prism-navy">{lens.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lens.detail}</p>
                <div aria-hidden="true" className="mt-8 h-px w-full bg-gradient-to-r from-prism-gold/60 to-transparent" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
