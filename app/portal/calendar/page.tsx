import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent, getPortalCalendar } from "@/features/portal/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  HOLIDAY: "success",
  EXAM: "warning",
  ANNOUNCEMENT: "outline",
};

export default async function PortalCalendarPage({
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

  const selectedMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  const monthStart = `${selectedMonth}-01`;
  const monthEnd = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).toISOString().slice(0, 10);

  const enrollments = await listEnrollmentsForStudent(supabase, active.id);
  const classId = enrollments.find((e) => e.is_current)?.class_id;
  const events = await getPortalCalendar(supabase, classId, monthStart, monthEnd);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <form className="flex items-center gap-2" method="get">
        {student_id && <input type="hidden" name="student_id" value={student_id} />}
        <label htmlFor="month" className="text-xs text-slate-500">Month</label>
        <input
          id="month"
          type="month"
          name="month"
          defaultValue={selectedMonth}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm shadow-sm"
        />
        <button type="submit" className="h-9 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">Apply</button>
      </form>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          {events.map((e, i) => (
            <div key={`${e.date}-${i}`} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{e.date}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{e.title}</span>
                <Badge variant={TYPE_VARIANT[e.type] ?? "outline"}>{e.type}</Badge>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="py-4 text-center text-slate-400">Nothing on the calendar this month.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
