import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listFeeTypes } from "@/features/fees/service";
import { FeeTypesManager } from "@/features/fees/components/fee-types-manager";

export default async function FeeTypesPage() {
  const supabase = await createClient();
  const [types, canManage] = await Promise.all([
    listFeeTypes(supabase),
    hasPermission("fees.manage_structure"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Fee Types</h1>
      </div>
      <FeeTypesManager initialTypes={types} canManage={canManage} />
    </div>
  );
}
