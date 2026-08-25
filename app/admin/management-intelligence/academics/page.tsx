import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getAcademicIntelligence, listAcademicYears } from "@/features/management-intelligence/service";
import { MetricCard } from "@/features/management-intelligence/components/metric-card";
import type { DeliveryStatus } from "@/features/management-intelligence/types";

type Params = {
  academic_year_id?: string;
  end?: string;
  class_id?: string;
  section_id?: string;
  subject_id?: string;
  teacher_id?: string;
  status?: DeliveryStatus;
};

const STATUS_BADGE: Record<DeliveryStatus, string> = {
  ON_TRACK: "bg-emerald-100 text-emerald-700",
  SLIGHTLY_BEHIND: "bg-amber-100 text-amber-700",
  WARNING: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
  INSUFFICIENT_DATA: "bg-slate-100 text-slate-500",
};

export default async function AcademicIntelligencePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [analytics, academicYears] = await Promise.all([
    getAcademicIntelligence(supabase, {
      academicYearId: params.academic_year_id,
      end: params.end,
      classId: params.class_id,
      sectionId: params.section_id,
      subjectId: params.subject_id,
      teacherId: params.teacher_id,
      status: params.status,
    }),
    listAcademicYears(supabase),
  ]);

  const rows = analytics.rows;
  const classCount = new Set(rows.map((r) => r.classId)).size;
  const subjectCount = new Set(rows.map((r) => `${r.classId}:${r.subjectId}`)).size;
  const countStatus = (status: DeliveryStatus) => rows.filter((r) => r.status === status).length;
  const evaluableCount = rows.filter((r) => r.dataCoverage !== "NOT_RECORDED").length;
  const coverage = rows.length > 0 ? Math.round((evaluableCount / rows.length) * 10_000) / 100 : null;

  const classOptions = analytics.classesAndSections?.classes ?? [];
  const sectionOptions = analytics.classesAndSections?.sections ?? [];
  const subjectOptions = analytics.subjects ?? [];
  const teacherOptions = analytics.teacherProfiles ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Academic Intelligence</h1>
        <p className="text-sm text-slate-500">
          Delivery evidence from lesson plans only. A timetable slot is never treated as a completed class, and a missing lesson plan is never
          treated as a missed one — status reflects only what has actually been recorded.
        </p>
      </div>

      {!analytics.academicYear && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No current academic year is configured.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Classes Evaluated" value={classCount} />
        <MetricCard label="Subjects Evaluated" value={subjectCount} />
        <MetricCard label="On Track" value={countStatus("ON_TRACK")} />
        <MetricCard label="Slightly Behind" value={countStatus("SLIGHTLY_BEHIND")} />
        <MetricCard label="Warning" value={countStatus("WARNING")} />
        <MetricCard label="Critical" value={countStatus("CRITICAL")} />
        <MetricCard label="Data Coverage" value={coverage === null ? "Not recorded" : `${coverage}%`} note={`${evaluableCount}/${rows.length} rows evaluable`} />
      </div>

      <Card><CardContent>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="text-xs font-medium text-slate-600">Academic year<select name="academic_year_id" defaultValue={analytics.academicYear?.id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm">{academicYears.map((item) => <option key={item.id} value={item.id}>{item.year_label}{item.is_current ? " (current)" : ""}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">As of<input name="end" type="date" defaultValue={analytics.asOfDate} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Class<select name="class_id" defaultValue={params.class_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All classes</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Section<select name="section_id" defaultValue={params.section_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All sections</option>{sectionOptions.filter((s) => !params.class_id || s.class_id === params.class_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Subject<select name="subject_id" defaultValue={params.subject_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All subjects</option>{subjectOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Teacher<select name="teacher_id" defaultValue={params.teacher_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All teachers</option>{teacherOptions.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Status<select name="status" defaultValue={params.status ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option value="ON_TRACK">On Track</option><option value="SLIGHTLY_BEHIND">Slightly Behind</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option><option value="INSUFFICIENT_DATA">Insufficient Data</option></select></label>
          <Button type="submit" className="self-end">Apply filters</Button>
        </form>
      </CardContent></Card>

      <Table><THead><TR><TH>Class</TH><TH>Section</TH><TH>Subject</TH><TH>Teacher</TH><TH>Expected</TH><TH>Actual</TH><TH>Lag Days</TH><TH>Status</TH><TH>Data Coverage</TH></TR></THead><TBody>
        {rows.map((row, index) => (
          <TR key={`${row.classId}-${row.sectionId}-${row.subjectId}-${index}`}>
            <TD>{row.className}</TD>
            <TD>{row.sectionName}</TD>
            <TD>{row.subjectName}</TD>
            <TD>{row.teacherName ?? <span className="text-slate-400">Unassigned</span>}</TD>
            <TD>{row.expectedProgress}</TD>
            <TD>{row.actualProgress}</TD>
            <TD>{row.lagDays === null ? <span className="text-slate-400">—</span> : row.lagDays}</TD>
            <TD><Badge className={STATUS_BADGE[row.status]}>{row.status.replace(/_/g, " ")}</Badge></TD>
            <TD>{row.dataCoverage.replace(/_/g, " ")}</TD>
          </TR>
        ))}
        {!rows.length && <TR><TD colSpan={9} className="py-8 text-center text-slate-500">No teacher assignments match these filters, or no lesson plans have been logged yet.</TD></TR>}
      </TBody></Table>
    </div>
  );
}
