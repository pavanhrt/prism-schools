import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listExams, listExamTerms } from "@/features/exams/service";
import { ExamsManager } from "@/features/exams/components/exams-manager";

export default async function ExamsPage() {
  const supabase = await createClient();
  const [exams, terms, canCreate] = await Promise.all([
    listExams(supabase),
    listExamTerms(supabase),
    hasPermission("exams.create"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Exams</h1>
      </div>
      <ExamsManager initialExams={exams} terms={terms} canCreate={canCreate} />
    </div>
  );
}
