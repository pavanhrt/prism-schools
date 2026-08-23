import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";
import { ContactDetails } from "@/components/school/contact/contact-details";
import { ContactHero } from "@/components/school/contact/contact-hero";

export const metadata: Metadata = {
  title: "Contact PRISM SCHOOLS",
  description: "Contact PRISM SCHOOLS for admissions, school visits, and general enquiries.",
};

const FALLBACK_ADDRESS = "Proddatur, Kadapa District, Andhra Pradesh, India";
const FALLBACK_EMAIL = "mpawangangireddy@gmail.com";

export default async function ContactPage() {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);

  return (
    <div className="overflow-hidden bg-white">
      <ContactHero />
      <ContactDetails
        address={settings.address?.trim() || FALLBACK_ADDRESS}
        email={settings.contact_email?.trim() || FALLBACK_EMAIL}
        phone={settings.contact_phone?.trim() || null}
      />
    </div>
  );
}
