import Link from "next/link";
import { SchoolLogo } from "@/components/school/school-logo";
import type { PublicSchoolSettings } from "@/features/public/types";
import { formatPublicAddress } from "@/features/public/service";

interface FooterLink {
  href: string;
  label: string;
}

interface SiteFooterProps {
  settings: PublicSchoolSettings;
  exploreLinks: FooterLink[];
}

export function SiteFooter({ settings, exploreLinks }: SiteFooterProps) {
  const address = formatPublicAddress(settings);
  const hasContactDetails = address || settings.contact_phone || settings.contact_email;

  return (
    <footer className="border-t border-prism-navy bg-prism-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <SchoolLogo size={44} onDark src={settings.logo_url} schoolName={settings.school_name} />
            <div>
              <p className="text-base font-semibold text-white">{settings.school_name}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-prism-gold">
                {settings.tagline}
              </p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-slate-400">
            {settings.description}
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
            {address && <li>{address}</li>}
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
          © {new Date().getFullYear()} {settings.school_name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
