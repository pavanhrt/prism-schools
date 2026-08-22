import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { getPayrollRun, listPayrollItems } from "@/features/payroll/service";
import { listStaff } from "@/features/staff/service";
import { PayrollRunDetail } from "@/features/payroll/components/payroll-run-detail";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function PayrollRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const run = await getPayrollRun(supabase, id);
  if (!run) notFound();

  const [items, staff, canProcess, canApprove] = await Promise.all([
    listPayrollItems(supabase, id),
    listStaff(supabase),
    hasPermission("payroll.process"),
    hasPermission("payroll.approve"),
  ]);

  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {MONTH_NAMES[run.month - 1]} {run.year}
        </h1>
      </div>
      <PayrollRunDetail
        runId={id}
        status={run.status}
        items={items}
        staffById={staffById}
        canProcess={canProcess}
        canApprove={canApprove}
      />
    </div>
  );
}
