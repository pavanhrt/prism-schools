import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the school office.",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Contact</h1>
      <div className="mt-6 flex flex-col gap-2 text-slate-700">
        {settings.address && <p>{settings.address}</p>}
        {settings.contact_phone && (
          <p>
            Phone: {" "}
            <a
              className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy"
              href={`tel:${settings.contact_phone}`}
            >
              {settings.contact_phone}
            </a>
          </p>
        )}
        {settings.contact_email && (
          <p>
            Email: {" "}
            <a
              className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy"
              href={`mailto:${settings.contact_email}`}
            >
              {settings.contact_email}
            </a>
          </p>
        )}
        {!settings.address && !settings.contact_phone && !settings.contact_email && (
          <p className="text-slate-600">
            Use our admissions enquiry form and our team will respond.
          </p>
        )}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        For admissions enquiries, use the{" "}
        <Link
          href="/admissions"
          className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy"
        >
          Admissions
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
