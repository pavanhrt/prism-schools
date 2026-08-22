import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAcademicYears } from "@/features/academics/repository";
import { AcademicYearsManager } from "@/features/academics/components/academic-years-manager";

export default async function AcademicYearsPage() {
  const supabase = await createClient();
  const [years, canCreate, canEdit, canDelete] = await Promise.all([
    listAcademicYears(supabase),
    hasPermission("academics.create"),
    hasPermission("academics.edit"),
    hasPermission("academics.delete"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Academic Years</h1>
        <p className="text-sm text-slate-500">
          Exactly one year is marked current at a time — it drives what &ldquo;this
          year&rdquo; means everywhere else in the system.
        </p>
      </div>
      <AcademicYearsManager
        initialYears={years}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
