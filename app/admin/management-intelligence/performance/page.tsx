import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getPerformanceIntelligence, listAcademicYears, listClassesAndSections, listStudentOptions } from "@/features/management-intelligence/service";
import { MetricCard } from "@/features/management-intelligence/components/metric-card";
import type { PerformanceTrendStatus } from "@/features/management-intelligence/types";

type Params = {
  academic_year_id?: string;
  term_id?: string;
  exam_id?: string;
  class_id?: string;
  section_id?: string;
  subject_id?: string;
  trend?: PerformanceTrendStatus;
  student_id?: string;
  page?: string;
};

function pageHref(params: Record<string, string | undefined>, page: number): string {
  const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  query.set("page", String(page));
  return query.toString();
}

const TREND_BADGE: Record<PerformanceTrendStatus, string> = {
  STRONGLY_IMPROVING: "bg-emerald-100 text-emerald-700",
  IMPROVING: "bg-emerald-100 text-emerald-700",
  STABLE: "bg-slate-100 text-slate-600",
  DECLINING: "bg-amber-100 text-amber-700",
  STRONGLY_DECLINING: "bg-red-100 text-red-700",
  INSUFFICIENT_DATA: "bg-slate-100 text-slate-400",
};

export default async function PerformanceIntelligencePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [analytics, academicYears, academics] = await Promise.all([
    getPerformanceIntelligence(supabase, {
      academicYearId: params.academic_year_id,
      termId: params.term_id,
      examId: params.exam_id,
      classId: params.class_id,
      sectionId: params.section_id,
      subjectId: params.subject_id,
      trend: params.trend,
      studentId: params.student_id,
      page: Number(params.page ?? "1") || 1,
    }),
    listAcademicYears(supabase),
    listClassesAndSections(supabase),
  ]);
  // Student options respect the same academic year + class/section scope
  // currently in view, per the filter completeness requirement.
  const studentOptions = await listStudentOptions(supabase, analytics.academicYear?.id, params.class_id, params.section_id);

  const insights = analytics.insights;
  const evaluated = insights.filter((s) => s.latestOverallPercentage !== null);
  const countTrend = (trend: PerformanceTrendStatus) => insights.filter((s) => s.trend === trend).length;
  const coverage = insights.length > 0 ? Math.round((evaluated.length / insights.length) * 10_000) / 100 : null;
  const requiresAttention = insights.filter((s) => s.requiresAttention);
  const topPerformers = [...evaluated].filter((s) => s.classRank !== null).sort((a, b) => (a.classRank ?? 0) - (b.classRank ?? 0)).slice(0, 10);

  const subjectTotals = new Map<string, { subjectName: string; sum: number; count: number; fail: number }>();
  for (const student of insights) {
    for (const subject of student.subjects) {
      if (subject.percentage === null) continue;
      const entry = subjectTotals.get(subject.subjectId) ?? { subjectName: subject.subjectName, sum: 0, count: 0, fail: 0 };
      entry.sum += subject.percentage;
      entry.count += 1;
      if (!subject.isPass) entry.fail += 1;
      subjectTotals.set(subject.subjectId, entry);
    }
  }
  const subjectSummary = [...subjectTotals.values()].map((entry) => ({
    subjectName: entry.subjectName,
    average: Math.round((entry.sum / entry.count) * 100) / 100,
    assessed: entry.count,
    failCount: entry.fail,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Performance Intelligence</h1>
        <p className="text-sm text-slate-500">
          {analytics.selectedExam ? <>Showing <strong>{analytics.selectedExam.name}</strong>, compared against {analytics.previousExam ? analytics.previousExam.name : "no earlier comparable exam"}. Only published or locked results are used.</> : "No published or locked exam results are available for this academic year yet."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Students Evaluated" value={evaluated.length} />
        <MetricCard label="Improving" value={countTrend("IMPROVING") + countTrend("STRONGLY_IMPROVING")} />
        <MetricCard label="Stable" value={countTrend("STABLE")} />
        <MetricCard label="Declining" value={countTrend("DECLINING")} />
        <MetricCard label="Strongly Declining" value={countTrend("STRONGLY_DECLINING")} />
        <MetricCard label="Requires Attention" value={requiresAttention.length} />
        <MetricCard label="Data Coverage" value={coverage === null ? "Not recorded" : `${coverage}%`} note={`${evaluated.length}/${insights.length} students evaluated`} />
      </div>

      <Card><CardContent>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="text-xs font-medium text-slate-600">Academic year<select name="academic_year_id" defaultValue={analytics.academicYear?.id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm">{academicYears.map((item) => <option key={item.id} value={item.id}>{item.year_label}{item.is_current ? " (current)" : ""}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Term<select name="term_id" defaultValue={params.term_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All terms</option>{(analytics.terms ?? []).map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Exam<select name="exam_id" defaultValue={analytics.selectedExam?.id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm">{(analytics.exams ?? []).map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Class<select name="class_id" defaultValue={params.class_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All classes</option>{academics.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Section<select name="section_id" defaultValue={params.section_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All sections</option>{academics.sections.filter((s) => !params.class_id || s.class_id === params.class_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Subject<select name="subject_id" defaultValue={params.subject_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All subjects</option>{(analytics.subjects ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Student<select name="student_id" defaultValue={params.student_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All students</option>{studentOptions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.admissionNo}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Trend<select name="trend" defaultValue={params.trend ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option value="STRONGLY_IMPROVING">Strongly Improving</option><option value="IMPROVING">Improving</option><option value="STABLE">Stable</option><option value="DECLINING">Declining</option><option value="STRONGLY_DECLINING">Strongly Declining</option><option value="INSUFFICIENT_DATA">Insufficient Data</option></select></label>
          <Button type="submit" className="self-end">Apply filters</Button>
        </form>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
        <CardContent>
          {topPerformers.length ? (
            <Table><THead><TR><TH>Rank</TH><TH>Student</TH><TH>Class</TH><TH>Percentage</TH></TR></THead><TBody>
              {topPerformers.map((s) => <TR key={s.studentId}><TD>{s.classRank}</TD><TD><Link href={`/admin/students/${s.studentId}`} className="font-medium text-slate-900 hover:underline">{s.studentName}</Link></TD><TD>{s.className} · {s.sectionName}</TD><TD>{s.latestOverallPercentage}%</TD></TR>)}
            </TBody></Table>
          ) : <p className="text-sm text-slate-500">No evaluated results in this scope yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Students Requiring Attention</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {requiresAttention.length ? requiresAttention.map((s) => (
            <div key={s.studentId} className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between">
                <Link href={`/admin/students/${s.studentId}`} className="font-medium text-slate-900 hover:underline">{s.studentName}</Link>
                <span className="text-xs text-slate-500">{s.className} · {s.sectionName}</span>
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{s.attentionReasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>
            </div>
          )) : <p className="text-sm text-slate-500">No students currently require attention under the configured thresholds.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Class Performance</CardTitle></CardHeader>
        <CardContent>
          <Table><THead><TR><TH>Class</TH><TH>Section</TH><TH>Assessed</TH><TH>Average</TH><TH>Highest</TH><TH>Lowest</TH><TH>Median</TH><TH>Pass %</TH></TR></THead><TBody>
            {analytics.classSummary.map((c) => <TR key={`${c.classId}-${c.sectionId}`}><TD>{c.className}</TD><TD>{c.sectionName}</TD><TD>{c.studentsAssessed}</TD><TD>{c.average ?? "—"}</TD><TD>{c.highest ?? "—"}</TD><TD>{c.lowest ?? "—"}</TD><TD>{c.median ?? "—"}</TD><TD>{c.passPercentage ?? "—"}</TD></TR>)}
            {!analytics.classSummary.length && <TR><TD colSpan={8} className="py-6 text-center text-slate-500">No class performance data yet.</TD></TR>}
          </TBody></Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subject Performance</CardTitle></CardHeader>
        <CardContent>
          <Table><THead><TR><TH>Subject</TH><TH>Assessed</TH><TH>Average</TH><TH>Failing</TH></TR></THead><TBody>
            {subjectSummary.map((s) => <TR key={s.subjectName}><TD>{s.subjectName}</TD><TD>{s.assessed}</TD><TD>{s.average}%</TD><TD>{s.failCount}</TD></TR>)}
            {!subjectSummary.length && <TR><TD colSpan={4} className="py-6 text-center text-slate-500">No subject performance data yet.</TD></TR>}
          </TBody></Table>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        &quot;Latest Overall&quot; is the student&apos;s full average this exam. &quot;Comparable&quot; shows only the subjects common to both exams — the actual
        basis the Trend is computed from, which can differ from Latest Overall when the exams don&apos;t share the exact same subject set.
      </p>
      <Table><THead><TR><TH>Student</TH><TH>Class</TH><TH>Latest Overall</TH><TH>Comparable (Current → Previous)</TH><TH>Difference</TH><TH>Trend</TH><TH>Class Rank</TH><TH>Failed Subjects</TH></TR></THead><TBody>
        {analytics.pageInsights.map((s) => (
          <TR key={s.studentId} className={s.studentId === params.student_id ? "bg-blue-50" : undefined}>
            <TD><Link href={`/admin/students/${s.studentId}`} className="font-medium text-slate-900 hover:underline">{s.studentName}</Link><p className="text-xs text-slate-400">{s.admissionNo}</p></TD>
            <TD>{s.className} · {s.sectionName}</TD>
            <TD>{s.latestOverallPercentage === null ? <span className="text-slate-400">Not Evaluated</span> : `${s.latestOverallPercentage}%`}</TD>
            <TD>
              {s.currentComparablePercentage === null || s.previousComparablePercentage === null ? (
                <span className="text-slate-400">Insufficient Data</span>
              ) : (
                `${s.currentComparablePercentage}% → ${s.previousComparablePercentage}%`
              )}
            </TD>
            <TD>{s.differencePoints ?? <span className="text-slate-400">—</span>}</TD>
            <TD><Badge className={TREND_BADGE[s.trend]}>{s.trend.replace(/_/g, " ")}</Badge></TD>
            <TD>{s.classRank ?? "—"}</TD>
            <TD>{s.failedSubjects.length ? s.failedSubjects.join(", ") : "—"}</TD>
          </TR>
        ))}
        {!analytics.pageInsights.length && <TR><TD colSpan={8} className="py-8 text-center text-slate-500">No students match these filters, or no published results exist yet.</TD></TR>}
      </TBody></Table>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{analytics.totalCount} students · page {analytics.page}{analytics.totalCount !== insights.length ? ` (ranked within ${insights.length} matching the current filters)` : ""}</span>
        <div className="flex gap-2">
          {analytics.page > 1 && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${pageHref(params, analytics.page - 1)}`}>Previous</Link>}
          {analytics.page * analytics.pageSize < analytics.totalCount && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${pageHref(params, analytics.page + 1)}`}>Next</Link>}
        </div>
      </div>
    </div>
  );
}
