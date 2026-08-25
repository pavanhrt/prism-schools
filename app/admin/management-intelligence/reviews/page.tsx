import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getDailyReview, getMonthlyReview, getWeeklyReview } from "@/features/management-intelligence/service";
import { MetricCard } from "@/features/management-intelligence/components/metric-card";

function pct(metric: { value: number | null; dataAvailable: boolean }) {
  return metric.dataAvailable && metric.value !== null ? `${metric.value}%` : "Not recorded";
}

export default async function ManagementReviewsPage() {
  const supabase = await createClient();
  const [daily, weekly, monthly] = await Promise.all([getDailyReview(supabase), getWeeklyReview(supabase), getMonthlyReview(supabase)]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Management Reviews</h1>
        <p className="text-sm text-slate-500">Deterministic daily, weekly, and monthly rollups built from the same underlying analytics — no subjective narrative is generated.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Daily Review</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <MetricCard label="Student Attendance" value={pct(daily.overview.students.attendanceTodayPercentage)} />
          <MetricCard label="Attendance Coverage" value={daily.overview.students.coverageToday.coveragePercentage === null ? daily.overview.students.coverageToday.status : `${daily.overview.students.coverageToday.coveragePercentage}%`} />
          <MetricCard label="Staff Attendance" value={pct(daily.overview.staff.attendancePercentage)} />
          <MetricCard label="Staff Coverage" value={daily.overview.staff.coverageToday.coveragePercentage === null ? daily.overview.staff.coverageToday.status : `${daily.overview.staff.coverageToday.coveragePercentage}%`} />
          <MetricCard label="Critical Alerts" value={daily.overview.schoolStatus.openCritical} />
          <MetricCard label="Warnings" value={daily.overview.schoolStatus.openWarnings} />
          <MetricCard label="Academic Delivery Coverage" value={daily.academicDeliveryCoverage === null ? "Not recorded" : `${daily.academicDeliveryCoverage}%`} />
        </div>
        <Card>
          <CardHeader><CardTitle>Subjects Requiring Attention</CardTitle></CardHeader>
          <CardContent>
            {daily.subjectsNeedingAttention.length ? (
              <ul className="flex flex-col gap-1 text-sm text-slate-700">
                {daily.subjectsNeedingAttention.map((row, i) => <li key={i}>{row.subjectName} ({row.className}) — <Badge className={row.status === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{row.status.replace(/_/g, " ")}</Badge>, {row.lagDays} days behind</li>)}
              </ul>
            ) : <p className="text-sm text-slate-500">No subjects are currently behind plan.</p>}
            <p className="mt-3 text-xs text-slate-400">Operational issues are tracked in the <Link href="/admin/management-intelligence/alerts?category=OPERATIONS" className="underline">Alert Center</Link>.</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Weekly Review</h2>
        <p className="text-xs text-slate-400">{weekly.periodStart} to {weekly.periodEnd}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Subjects Behind" value={weekly.subjectsBehind.length} />
          <MetricCard label="New Alerts" value={weekly.newAlerts} />
          <MetricCard label="Resolved Alerts" value={weekly.resolvedAlerts} />
          <MetricCard label="Fee Collection %" value={weekly.fees.summary.collectionPercentage === null ? "Not recorded" : `${weekly.fees.summary.collectionPercentage}%`} />
        </div>
        <Card>
          <CardHeader><CardTitle>Subjects Behind Plan</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Class</TH><TH>Subject</TH><TH>Status</TH><TH>Lag Days</TH></TR></THead><TBody>
              {weekly.subjectsBehind.map((row, i) => <TR key={i}><TD>{row.className}</TD><TD>{row.subjectName}</TD><TD><Badge className={row.status === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{row.status.replace(/_/g, " ")}</Badge></TD><TD>{row.lagDays}</TD></TR>)}
              {!weekly.subjectsBehind.length && <TR><TD colSpan={4} className="py-6 text-center text-slate-500">No subjects behind plan this week.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Monthly Review</h2>
        <p className="text-xs text-slate-400">{monthly.periodStart} to {monthly.periodEnd}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Improving Students" value={monthly.improvingStudents.length} />
          <MetricCard label="Declining Students" value={monthly.decliningStudents.length} />
          <MetricCard label="Requires Attention" value={monthly.requiresAttention.length} />
          <MetricCard label="Outstanding Fees" value={monthly.fees.summary.outstanding} />
        </div>
        <Card>
          <CardHeader><CardTitle>Alert Summary</CardTitle></CardHeader>
          <CardContent className="flex gap-6 text-sm text-slate-700">
            <span>Open Critical: <strong>{monthly.alertSummary.openCritical}</strong></span>
            <span>Open Warnings: <strong>{monthly.alertSummary.openWarnings}</strong></span>
            <span>Resolved This Period: <strong>{monthly.alertSummary.resolvedThisPeriod}</strong></span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Rank</TH><TH>Student</TH><TH>Class</TH><TH>Percentage</TH></TR></THead><TBody>
              {monthly.topPerformers.map((s) => <TR key={s.studentId}><TD>{s.classRank}</TD><TD><Link href={`/admin/students/${s.studentId}`} className="font-medium text-slate-900 hover:underline">{s.studentName}</Link></TD><TD>{s.className} · {s.sectionName}</TD><TD>{s.latestOverallPercentage}%</TD></TR>)}
              {!monthly.topPerformers.length && <TR><TD colSpan={4} className="py-6 text-center text-slate-500">No ranked results yet.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Class Performance</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Class</TH><TH>Section</TH><TH>Average</TH><TH>Pass %</TH></TR></THead><TBody>
              {monthly.classPerformance.map((c) => <TR key={`${c.classId}-${c.sectionId}`}><TD>{c.className}</TD><TD>{c.sectionName}</TD><TD>{c.average ?? "—"}</TD><TD>{c.passPercentage ?? "—"}</TD></TR>)}
              {!monthly.classPerformance.length && <TR><TD colSpan={4} className="py-6 text-center text-slate-500">No class performance data yet.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Student Review</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Student</TH><TH>Class</TH><TH>Attendance</TH><TH>Att. Trend</TH><TH>Latest Overall</TH><TH>Comparable %</TH><TH>Previous %</TH><TH>Difference</TH><TH>Perf. Trend</TH><TH>Attention</TH><TH>Rank</TH><TH>Active Alerts</TH></TR></THead><TBody>
              {monthly.studentReview.map((row) => (
                <TR key={row.studentId}>
                  <TD><Link href={`/admin/students/${row.studentId}`} className="font-medium text-slate-900 hover:underline">{row.studentName}</Link></TD>
                  <TD>{row.className} · {row.sectionName}</TD>
                  <TD>{row.attendancePercentage === null ? "Insufficient Data" : `${row.attendancePercentage}%`}</TD>
                  <TD>{row.attendanceTrend.replace(/_/g, " ")}</TD>
                  <TD>{row.currentPerformance === null ? "Not Evaluated" : `${row.currentPerformance}%`}</TD>
                  <TD>{row.currentComparablePerformance === null ? <span className="text-slate-400">Insufficient Data</span> : `${row.currentComparablePerformance}%`}</TD>
                  <TD>{row.previousPerformance === null ? "Insufficient Data" : `${row.previousPerformance}%`}</TD>
                  <TD>{row.performanceDifference ?? "—"}</TD>
                  <TD>{row.performanceTrend.replace(/_/g, " ")}</TD>
                  <TD>{row.subjectsRequiringAttention}</TD>
                  <TD>{row.classRank ?? "—"}</TD>
                  <TD>{row.activeAlerts}</TD>
                </TR>
              ))}
              {!monthly.studentReview.length && <TR><TD colSpan={12} className="py-8 text-center text-slate-500">No active students this academic year.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
        <p className="text-xs text-slate-400">{monthly.healthScoreTrendMessage}</p>
      </section>
    </div>
  );
}
