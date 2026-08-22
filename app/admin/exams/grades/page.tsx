import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listGradeScales } from "@/features/exams/service";
import { GradeScalesManager } from "@/features/exams/components/grade-scales-manager";

export default async function GradeScalesPage() {
  const supabase = await createClient();
  const [scales, canManage] = await Promise.all([
    listGradeScales(supabase),
    hasPermission("grades.manage"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Grade Scale</h1>
        <p className="text-sm text-slate-500">
          Configurable, not hardcoded — every report card and marks sheet reads grades from
          here.
        </p>
      </div>
      <GradeScalesManager initialScales={scales} canManage={canManage} />
    </div>
  );
}
