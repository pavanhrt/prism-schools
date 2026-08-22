import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { getStaff, listLeaveRequests } from "@/features/staff/service";
import { listAdjustmentsForStaff } from "@/features/payroll/service";
import { AdjustmentForm } from "@/features/payroll/components/adjustment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const staff = await getStaff(supabase, id);
  if (!staff) notFound();

  const [allLeaveRequests, adjustments, canViewPayroll] = await Promise.all([
    listLeaveRequests(supabase),
    listAdjustmentsForStaff(supabase, id),
    hasPermission("payroll.approve"),
  ]);
  const leaveRequests = allLeaveRequests.filter((l) => l.staff_id === id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{staff.first_name} {staff.last_name}</h1>
        <p className="text-sm text-slate-500">{staff.staff_no} · {staff.designation ?? "—"} · {staff.department ?? "—"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Email</dt><dd className="text-slate-900">{staff.email}</dd>
              <dt className="text-slate-500">Phone</dt><dd className="text-slate-900">{staff.phone}</dd>
              <dt className="text-slate-500">Date of birth</dt><dd className="text-slate-900">{staff.dob}</dd>
              <dt className="text-slate-500">Joined</dt><dd className="text-slate-900">{staff.date_of_joining}</dd>
              <dt className="text-slate-500">Basic salary</dt><dd className="text-slate-900">₹{staff.basic_salary.toFixed(2)}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd><Badge variant={staff.status === "active" ? "success" : "outline"}>{staff.status}</Badge></dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Type</TH>
                  <TH>Dates</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {leaveRequests.map((l) => (
                  <TR key={l.id}>
                    <TD className="capitalize">{l.leave_type}</TD>
                    <TD>{l.start_date} → {l.end_date}</TD>
                    <TD>
                      <Badge variant={l.status === "approved" ? "success" : l.status === "rejected" ? "outline" : "warning"}>
                        {l.status}
                      </Badge>
                    </TD>
                  </TR>
                ))}
                {leaveRequests.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="py-6 text-center text-slate-400">No leave requests.</TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {canViewPayroll && <AdjustmentForm staffId={id} existing={adjustments} />}
    </div>
  );
}
