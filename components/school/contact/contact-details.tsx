import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

interface ContactDetailsProps {
  address: string;
  email: string;
  phone: string | null;
}

export function ContactDetails({ address, email, phone }: ContactDetailsProps) {
  return (
    <section className="bg-prism-bg py-20 sm:py-24 lg:py-28" aria-labelledby="contact-details-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">How to reach us</p>
          <h2 id="contact-details-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-prism-navy sm:text-4xl">
            A conversation is the best place to begin
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Whether you are exploring admissions or simply want to learn more about PRISM,
            choose the contact option that works best for you.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-prism-bg text-prism-navy">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-prism-navy">Visit PRISM</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{address}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-prism-bg text-prism-navy">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-prism-navy">Email our team</h3>
            <a href={`mailto:${email}`} className="mt-2 block break-all rounded-sm text-sm font-medium leading-6 text-prism-navy underline decoration-prism-gold underline-offset-4 transition-colors hover:text-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2">
              {email}
            </a>
          </article>

          {phone && (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-prism-bg text-prism-navy">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-prism-navy">Call the school</h3>
              <a href={`tel:${phone}`} className="mt-2 block break-words rounded-sm text-sm font-medium leading-6 text-prism-navy underline decoration-prism-gold underline-offset-4 transition-colors hover:text-prism-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy focus-visible:ring-offset-2">
                {phone}
              </a>
            </article>
          )}

          <article className="rounded-2xl border border-prism-gold/30 bg-prism-navy p-6 text-white shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold">Admissions</p>
            <h3 className="mt-4 text-xl font-semibold">Ready to take the next step?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">Share a few details through our secure admissions enquiry form.</p>
            <Link href="/admissions" className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-prism-gold transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">
              Go to admissions <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
