import type { Metadata } from "next";
import { EnquiryForm } from "@/features/public/components/enquiry-form";

export const metadata: Metadata = {
  title: "Admissions",
  description: "Start an admissions enquiry.",
};

export default function AdmissionsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Admissions</h1>
      <p className="mt-4 text-slate-700">
        Tell us a bit about your child and we&apos;ll reach out to guide you through the
        admissions process — from enquiry, to application, to enrollment.
      </p>
      <div className="mt-8 rounded-lg border border-slate-200 p-6">
        <EnquiryForm />
      </div>
    </div>
  );
}
