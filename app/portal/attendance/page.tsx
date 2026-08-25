import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listAttendanceForStudent } from "@/features/attendance/service";
import { computeAttendanceBreakdown } from "@/features/portal/rules";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function PortalAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; month?: string }>;
}) {
  const { student_id, month } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);
  if (!active) return <p className="text-sm text-slate-500">No student linked to your account.</p>;

  const allRecords = await listAttendanceForStudent(supabase, active.id);
  const selectedMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  const monthRecords = allRecords.filter((r) => r.attendance_date.startsWith(selectedMonth));
  const breakdown = computeAttendanceBreakdown(monthRecords);

  const months = Array.from(new Set(allRecords.map((r) => r.attendance_date.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
  if (!months.includes(selectedMonth)) months.unshift(selectedMonth);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Attendance</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <form className="flex items-center gap-2" method="get">
        {student_id && <input type="hidden" name="student_id" value={student_id} />}
        <label htmlFor="month" className="text-xs text-slate-500">Month</label>
        <select
          id="month"
          name="month"
          defaultValue={selectedMonth}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm shadow-sm"
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Apply
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-slate-500">This month</p>
          <p className="text-2xl font-semibold text-slate-900">{breakdown.percentage !== null ? `${breakdown.percentage}%` : "—"}</p>
        </CardContent></Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-5 text-xs text-slate-600">
            <span>Present: {breakdown.presentDays}</span>
            <span>Absent: {breakdown.absentDays}</span>
            <span>Late: {breakdown.lateDays}</span>
            <span>Half day: {breakdown.halfDays}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Date</TH><TH>Status</TH></TR></THead>
            <TBody>
              {monthRecords.map((r) => (
                <TR key={r.id}>
                  <TD>{r.attendance_date}</TD>
                  <TD><Badge variant={r.status === "present" ? "success" : r.status === "absent" ? "outline" : "warning"}>{r.status.replace("_", " ")}</Badge></TD>
                </TR>
              ))}
              {monthRecords.length === 0 && <TR><TD colSpan={2} className="py-6 text-center text-slate-400">No attendance recorded for this month.</TD></TR>}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
