import { createClient } from "@/lib/supabase/server";
import { listAcademicYears, listClasses, listSections } from "@/features/academics/repository";
import { StudentForm } from "@/features/students/components/student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const [classes, sections, academicYears] = await Promise.all([
    listClasses(supabase),
    listSections(supabase),
    listAcademicYears(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Student</h1>
        <p className="text-sm text-slate-500">
          Direct walk-in admission — bypasses the CRM funnel for a student who&apos;s
          already decided to join.
        </p>
      </div>
      <StudentForm classes={classes} sections={sections} academicYears={academicYears} />
    </div>
  );
}
