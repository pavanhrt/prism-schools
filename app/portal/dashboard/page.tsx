import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listAttendanceForStudent } from "@/features/attendance/service";
import { listExamSchedules, listResultsForStudent } from "@/features/exams/service";
import { listInvoices, listAllPayments } from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { listNotices } from "@/features/communication/service";
import { listClasses, listSections } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);

  if (!active) {
    return (
      <Card>
        <CardHeader><CardTitle>Welcome</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            No student record is linked to your account yet — ask the school office to link it.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [enrollments, attendance, examSchedules, results, invoices, payments, notices, classes, sections] =
    await Promise.all([
      listEnrollmentsForStudent(supabase, active.id),
      listAttendanceForStudent(supabase, active.id),
      listExamSchedules(supabase),
      listResultsForStudent(supabase, active.id),
      listInvoices(supabase),
      listAllPayments(supabase),
      listNotices(supabase),
      listClasses(supabase),
      listSections(supabase),
    ]);

  const currentEnrollment = enrollments.find((e) => e.is_current);
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = examSchedules
    .filter((s) => s.class_id === currentEnrollment?.class_id && s.exam_date >= today)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .slice(0, 3);

  const myInvoices = invoices.filter((i) => i.student_id === active.id);
  const totalBalance = myInvoices.reduce(
    (sum, inv) => sum + computeInvoiceBalance(inv, payments).balance,
    0,
  );

  const relevantNotices = notices
    .filter((n) => n.status === "active" && (n.target_role === "all" || n.target_role === "student" || n.target_role === "parent"))
    .slice(0, 5);

  const publishedResults = results.filter((r) => {
    const schedule = examSchedules.find((s) => s.id === r.exam_schedule_id);
    return schedule && (schedule.result_status === "published" || schedule.result_status === "locked");
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{active.first_name} {active.last_name}</h1>
          <p className="text-sm text-slate-500">
            {active.admission_no}
            {currentEnrollment ? ` · ${classById.get(currentEnrollment.class_id) ?? ""} ${sectionById.get(currentEnrollment.section_id) ?? ""}` : ""}
          </p>
        </div>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-slate-500">Attendance</p>
          <p className="text-xl font-semibold text-slate-900">{attendancePct !== null ? `${attendancePct}%` : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-slate-500">Fee balance</p>
          <p className="text-xl font-semibold text-slate-900">₹{totalBalance.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming exams</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {upcomingExams.map((e) => (
            <div key={e.id} className="flex justify-between text-sm">
              <span className="text-slate-700">{e.exam_date}</span>
              <span className="text-slate-500">{e.start_time.slice(0, 5)}</span>
            </div>
          ))}
          {upcomingExams.length === 0 && <p className="text-sm text-slate-400">Nothing scheduled.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent results</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {publishedResults.slice(0, 3).map((r) => (
            <div key={r.id} className="flex justify-between text-sm">
              <span className="text-slate-700">Theory {r.marks_theory ?? "—"} / Practical {r.marks_practical ?? "—"}</span>
              <Badge variant="outline">{r.attendance_status}</Badge>
            </div>
          ))}
          {publishedResults.length === 0 && <p className="text-sm text-slate-400">No published results yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notices</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {relevantNotices.map((n) => (
            <div key={n.id} className="text-sm">
              <p className="font-medium text-slate-900">{n.title}</p>
              <p className="text-slate-600">{n.message}</p>
            </div>
          ))}
          {relevantNotices.length === 0 && <p className="text-sm text-slate-400">No notices.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
