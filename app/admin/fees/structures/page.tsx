import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listFeeStructures, listFeeTypes } from "@/features/fees/service";
import { listAcademicYears, listClasses } from "@/features/academics/repository";
import { FeeStructuresManager } from "@/features/fees/components/fee-structures-manager";

export default async function FeeStructuresPage() {
  const supabase = await createClient();
  const [structures, classes, feeTypes, academicYears, canManage] = await Promise.all([
    listFeeStructures(supabase),
    listClasses(supabase),
    listFeeTypes(supabase),
    listAcademicYears(supabase),
    hasPermission("fees.manage_structure"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Fee Structures</h1>
        <p className="text-sm text-slate-500">What each class owes per fee type, per year — this is what bulk invoice generation reads.</p>
      </div>
      <FeeStructuresManager
        initialStructures={structures}
        classes={classes}
        feeTypes={feeTypes}
        academicYears={academicYears}
        canManage={canManage}
      />
    </div>
  );
}
