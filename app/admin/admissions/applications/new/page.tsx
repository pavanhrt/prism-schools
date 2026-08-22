import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInquiry } from "@/features/admissions/service";
import { listClasses, listAcademicYears } from "@/features/academics/repository";
import { ApplicationForm } from "@/features/admissions/components/application-form";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string }>;
}) {
  const { inquiry_id } = await searchParams;
  if (!inquiry_id) notFound();

  const supabase = await createClient();
  const [inquiry, classes, academicYears] = await Promise.all([
    getInquiry(supabase, inquiry_id),
    listClasses(supabase),
    listAcademicYears(supabase),
  ]);

  if (!inquiry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New Application</h1>
        <p className="text-sm text-slate-500">
          Converts this inquiry into a formal application — the fuller record Admission
          copies into a student.
        </p>
      </div>
      <ApplicationForm inquiry={inquiry} classes={classes} academicYears={academicYears} />
    </div>
  );
}
