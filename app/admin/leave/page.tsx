import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listLeaveRequests, listStaff } from "@/features/staff/service";
import { LeaveManager } from "@/features/staff/components/leave-manager";

export default async function LeavePage() {
  const supabase = await createClient();
  const [requests, staff, canCreate, canApprove] = await Promise.all([
    listLeaveRequests(supabase),
    listStaff(supabase),
    hasPermission("leave.create"),
    hasPermission("leave.approve"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Leave</h1>
      </div>
      <LeaveManager
        initialRequests={requests}
        staff={staff}
        canCreate={canCreate}
        canApprove={canApprove}
      />
    </div>
  );
}
