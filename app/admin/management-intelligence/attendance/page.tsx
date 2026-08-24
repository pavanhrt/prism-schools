import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getAttendanceIntelligence, listAcademicYears, listClassesAndSections } from "@/features/management-intelligence/service";

type Params = { academic_year_id?: string; start?: string; end?: string; class_id?: string; section_id?: string; status?: string; severity?: string; page?: string };

export default async function AttendanceIntelligencePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [analytics, academics, academicYears] = await Promise.all([
    getAttendanceIntelligence(supabase, { academicYearId: params.academic_year_id, start: params.start, end: params.end, classId: params.class_id, sectionId: params.section_id }),
    listClassesAndSections(supabase),
    listAcademicYears(supabase),
  ]);
  let rows = analytics.studentInsights;
  if (params.severity) rows = rows.filter((row) => row.severity === params.severity);
  if (params.status === "declining") rows = rows.filter((row) => row.trend === "DECLINING");
  if (params.status === "absence") rows = rows.filter((row) => row.consecutiveAbsenceDays > 0);
  if (params.status === "insufficient") rows = rows.filter((row) => row.attendancePercentage === null);
  const pageSize = 25;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const queryBase = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-xl font-semibold text-slate-900">Attendance Intelligence</h1><p className="text-sm text-slate-500">Recorded working-day attendance, comparable-period trend, and explicit absence streaks.</p></div>
      <Card><CardContent>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <label className="text-xs font-medium text-slate-600">Academic year<select name="academic_year_id" defaultValue={analytics.academicYear?.id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm">{academicYears.map((item) => <option key={item.id} value={item.id}>{item.year_label}{item.is_current ? " (current)" : ""}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Start<input name="start" type="date" defaultValue={analytics.start} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">End<input name="end" type="date" defaultValue={analytics.end} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Class<select name="class_id" defaultValue={params.class_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All classes</option>{academics.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Section<select name="section_id" defaultValue={params.section_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All sections</option>{academics.sections.filter((item) => !params.class_id || item.class_id === params.class_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Status<select name="status" defaultValue={params.status ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option value="declining">Declining</option><option value="absence">Absent streak</option><option value="insufficient">Insufficient data</option></select></label>
          <label className="text-xs font-medium text-slate-600">Severity<select name="severity" defaultValue={params.severity ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option>CRITICAL</option><option>WARNING</option><option>INFO</option></select></label>
          <Button type="submit" className="self-end">Apply filters</Button>
        </form>
      </CardContent></Card>
      {!analytics.academicYear && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No current academic year is configured.</p>}
      <Table><THead><TR><TH>Student</TH><TH>Class</TH><TH>Attendance</TH><TH>Absent streak</TH><TH>Previous</TH><TH>Trend</TH><TH>Severity</TH></TR></THead><TBody>
        {pageRows.map((row) => <TR key={row.studentId}><TD><Link href={`/admin/students/${row.studentId}`} className="font-medium text-slate-900 hover:underline">{row.studentName}</Link><p className="text-xs text-slate-400">{row.admissionNo}</p></TD><TD>{row.className} · {row.sectionName}</TD><TD>{row.attendancePercentage === null ? <span className="text-slate-400">Insufficient Data</span> : <>{row.attendancePercentage}%<p className="text-xs text-slate-400">{row.presentDays}/{row.recordedWorkingDays} recorded days</p></>}</TD><TD>{row.consecutiveAbsenceDays}</TD><TD>{row.previousPercentage === null ? "Insufficient Data" : `${row.previousPercentage}%`}</TD><TD>{row.trend}{row.differencePoints !== null && <p className="text-xs text-slate-400">{row.differencePoints} points</p>}</TD><TD>{row.severity ? <Badge className={row.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{row.severity}</Badge> : "—"}</TD></TR>)}
        {!pageRows.length && <TR><TD colSpan={7} className="py-8 text-center text-slate-500">No students match these filters. Missing attendance is shown as insufficient data, never 0%.</TD></TR>}
      </TBody></Table>
      <div className="flex items-center justify-between text-sm text-slate-500"><span>{rows.length} students · page {page}</span><div className="flex gap-2">{page > 1 && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${new URLSearchParams([...queryBase.entries()].filter(([key]) => key !== "page").concat([["page", String(page - 1)]])).toString()}`}>Previous</Link>}{page * pageSize < rows.length && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${new URLSearchParams([...queryBase.entries()].filter(([key]) => key !== "page").concat([["page", String(page + 1)]])).toString()}`}>Next</Link>}</div></div>
    </div>
  );
}
