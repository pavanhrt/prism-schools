import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listPayrollRuns } from "@/features/payroll/service";
import { PayrollRunsManager } from "@/features/payroll/components/payroll-runs-manager";

export default async function PayrollPage() {
  const supabase = await createClient();
  const [runs, canCreate] = await Promise.all([
    listPayrollRuns(supabase),
    hasPermission("payroll.process"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Payroll</h1>
        <p className="text-sm text-slate-500">Draft → Calculated → Reviewed → Approved → Processed.</p>
      </div>
      <PayrollRunsManager initialRuns={runs} canCreate={canCreate} />
    </div>
  );
}
