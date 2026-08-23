import type { Metadata } from "next";
import { AdmissionsEnquiry } from "@/components/school/admissions/admissions-enquiry";
import { AdmissionsHero } from "@/components/school/admissions/admissions-hero";
import { AdmissionsProcess } from "@/components/school/admissions/admissions-process";

export const metadata: Metadata = {
  title: "Admissions",
  description: "Begin your child's PRISM journey and connect with our admissions team.",
};

export default function AdmissionsPage() {
  return (
    <div className="overflow-hidden">
      <AdmissionsHero />
      <AdmissionsProcess />
      <AdmissionsEnquiry />
    </div>
  );
}
