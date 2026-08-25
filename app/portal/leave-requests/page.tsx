import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent, listMyLeaveRequests } from "@/features/portal/service";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { LeaveRequestForm } from "@/features/portal/components/leave-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);
  if (!active) return <p className="text-sm text-slate-500">No student linked to your account.</p>;

  const requests = await listMyLeaveRequests(supabase, active.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Leave Requests</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>New request</CardTitle></CardHeader>
        <CardContent>
          <LeaveRequestForm studentId={active.id} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.from_date} → {r.to_date}</CardTitle>
              <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "warning" : "outline"}>{r.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {r.reason && <p className="text-sm text-slate-700">{r.reason}</p>}
              {r.review_note && <p className="text-xs text-slate-500">Staff note: {r.review_note}</p>}
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && <p className="py-8 text-center text-slate-400">No leave requests yet.</p>}
      </div>
    </div>
  );
}
