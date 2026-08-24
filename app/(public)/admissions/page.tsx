import { AdmissionsEnquiry } from "@/components/school/admissions/admissions-enquiry";
import { AdmissionsHero } from "@/components/school/admissions/admissions-hero";
import { AdmissionsProcess } from "@/components/school/admissions/admissions-process";
import { getPublicPageMetadata } from "@/features/public/metadata";

export const generateMetadata = () => getPublicPageMetadata("admissions");

export default function AdmissionsPage() {
  return (
    <div className="overflow-hidden">
      <AdmissionsHero />
      <AdmissionsProcess />
      <AdmissionsEnquiry />
    </div>
  );
}
