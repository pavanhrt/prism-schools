import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listExamTerms } from "@/features/exams/service";
import { listAcademicYears } from "@/features/academics/repository";
import { ExamTermsManager } from "@/features/exams/components/exam-terms-manager";

export default async function ExamTermsPage() {
  const supabase = await createClient();
  const [terms, academicYears, canCreate] = await Promise.all([
    listExamTerms(supabase),
    listAcademicYears(supabase),
    hasPermission("exams.create"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Exam Terms</h1>
        <p className="text-sm text-slate-500">Academic Year → Term → Exam → Schedule → Results.</p>
      </div>
      <ExamTermsManager initialTerms={terms} academicYears={academicYears} canCreate={canCreate} />
    </div>
  );
}
