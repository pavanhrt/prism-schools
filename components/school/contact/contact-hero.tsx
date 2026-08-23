import Link from "next/link";

export function ContactHero() {
  return (
    <section className="relative isolate overflow-hidden bg-prism-navy text-white" aria-labelledby="contact-title">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -right-28 -top-36 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div className="absolute -right-2 top-10 h-72 w-72 rotate-12 rounded-[3rem] border border-prism-gold/25" />
        <div className="absolute right-24 top-28 h-36 w-36 rotate-45 bg-white/[0.04]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-prism-gold/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">Contact PRISM</p>
          <h1 id="contact-title" className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Let&apos;s Talk About Your Child&apos;s Future
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
            Admissions, school visits, and general enquiries — our team is here to help.
          </p>
          <Link href="/admissions" className="mt-9 inline-flex rounded-md bg-prism-gold px-5 py-3 text-sm font-semibold text-prism-navy shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">
            Enquire about admissions
          </Link>
        </div>
      </div>
    </section>
  );
}
