import type { Metadata } from "next";
import { formatPublicAddress, getPublicSchoolSettingsCached } from "@/features/public/service";
import { ContactDetails } from "@/components/school/contact/contact-details";
import { ContactHero } from "@/components/school/contact/contact-hero";

export const metadata: Metadata = {
  title: "Contact PRISM SCHOOLS",
  description: "Contact PRISM SCHOOLS for admissions, school visits, and general enquiries.",
};

export default async function ContactPage() {
  const settings = await getPublicSchoolSettingsCached();

  return (
    <div className="overflow-hidden bg-white">
      <ContactHero />
      <ContactDetails
        address={formatPublicAddress(settings)}
        email={settings.contact_email?.trim() || null}
        phone={settings.contact_phone?.trim() || null}
      />
    </div>
  );
}
