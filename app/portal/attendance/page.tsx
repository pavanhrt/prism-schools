import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listAttendanceForStudent } from "@/features/attendance/service";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function PortalAttendancePage({
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

  const records = await listAttendanceForStudent(supabase, active.id);
  const presentCount = records.filter((r) => r.status === "present").length;
  const pct = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Attendance</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>Overall</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-slate-900">{pct !== null ? `${pct}%` : "—"}</p>
          <p className="text-xs text-slate-500">{presentCount} present of {records.length} recorded days</p>
        </CardContent>
      </Card>

      <Table>
        <THead><TR><TH>Date</TH><TH>Status</TH></TR></THead>
        <TBody>
          {records.map((r) => (
            <TR key={r.id}>
              <TD>{r.attendance_date}</TD>
              <TD><Badge variant={r.status === "present" ? "success" : r.status === "absent" ? "outline" : "warning"}>{r.status.replace("_", " ")}</Badge></TD>
            </TR>
          ))}
          {records.length === 0 && <TR><TD colSpan={2} className="py-6 text-center text-slate-400">No attendance recorded yet.</TD></TR>}
        </TBody>
      </Table>
    </div>
  );
}
