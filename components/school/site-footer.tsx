import Link from "next/link";
import { SchoolLogo } from "@/components/school/school-logo";
import type { SchoolSettings } from "@/types/settings";
import { PRISM_TAGLINE } from "@/components/school/brand";

interface FooterLink {
  href: string;
  label: string;
}

interface SiteFooterProps {
  schoolName: string;
  settings: SchoolSettings;
  exploreLinks: FooterLink[];
}

export function SiteFooter({ schoolName, settings, exploreLinks }: SiteFooterProps) {
  const hasContactDetails = settings.address || settings.contact_phone || settings.contact_email;

  return (
    <footer className="border-t border-prism-navy bg-prism-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <SchoolLogo size={44} onDark />
            <div>
              <p className="text-base font-semibold text-white">{schoolName}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-prism-gold">
                {PRISM_TAGLINE}
              </p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-slate-400">
            A modern, future-focused school combining strong academic foundations with
            technology, creativity, and real-world learning — preparing students to explore,
            create, build, solve, and lead.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Explore</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {exploreLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-sm text-sm text-slate-300 transition-colors hover:text-prism-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Get in Touch</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-slate-300">
            {settings.address && <li>{settings.address}</li>}
            {settings.contact_phone && <li className="break-words"><a className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold" href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></li>}
            {settings.contact_email && <li className="break-words"><a className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>}
            {!hasContactDetails && <li>Our team would be glad to hear from you.</li>}
            <li>
              <Link href="/contact" className="rounded-sm text-prism-gold transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-gold focus-visible:ring-offset-2 focus-visible:ring-offset-prism-navy">
                Contact page →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-slate-400">
          © {new Date().getFullYear()} {schoolName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
