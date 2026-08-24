import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { MetricCard } from "@/features/management-intelligence/components/metric-card";
import { RefreshAlertsButton } from "@/features/management-intelligence/components/refresh-alerts-button";
import { alertDestination, getManagementOverview, listAlerts } from "@/features/management-intelligence/service";

function displayMetric(metric: { value: number | null; dataAvailable: boolean }, suffix = "") {
  return metric.dataAvailable && metric.value !== null ? `${metric.value}${suffix}` : "Not recorded";
}
export default async function ManagementIntelligencePage() {
  const supabase = await createClient();
  const [overview, alerts, canManageAlerts] = await Promise.all([
    getManagementOverview(supabase),
    listAlerts(supabase, { statuses: ["OPEN", "ACKNOWLEDGED"], pageSize: 12 }),
    hasPermission("management_intelligence.manage_alerts"),
  ]);
  const severityGroups = ["CRITICAL", "WARNING", "INFO"] as const;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Management Intelligence</h1>
          <p className="text-sm text-slate-500">Operational visibility across PRISM Schools</p>
          <p className="mt-1 text-xs text-slate-400">Period: {overview.periodStart} to {overview.periodEnd}{overview.academicYearLabel ? ` · FY ${overview.academicYearLabel}` : ""}</p>
        </div>
        {canManageAlerts && <RefreshAlertsButton />}
      </div>

      {overview.evaluationMessage && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{overview.evaluationMessage}</div>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">School Status</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="School Health Score" value="Not configured" note="Health Score available after analytics configuration" />
          <MetricCard label="Open Critical Alerts" value={overview.schoolStatus.openCritical} />
          <MetricCard label="Open Warnings" value={overview.schoolStatus.openWarnings} />
          <MetricCard label="Resolved This Period" value={overview.schoolStatus.resolvedThisPeriod} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Student Attendance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active Students" value={overview.students.active} />
          <MetricCard label="Present Today" value={displayMetric(overview.students.presentToday)} note="Headcount: present, late, or half-day" />
          <MetricCard label="Absent Today" value={displayMetric(overview.students.absentToday)} />
          <MetricCard label="Today's Attendance" value={displayMetric(overview.students.attendanceTodayPercentage, "%")} note="Weighted: half-day counts as 0.5" />
          <MetricCard label="Absent 3+ Days" value={overview.students.absentWarning} />
          <MetricCard label="Absent 5+ Days" value={overview.students.absentCritical} />
          <MetricCard label="Below 75%" value={overview.students.belowWarning} />
          <MetricCard label="Below 65%" value={overview.students.belowCritical} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Staff Attendance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Active Staff" value={overview.staff.active} />
          <MetricCard label="Present Today" value={displayMetric(overview.staff.presentToday)} />
          <MetricCard label="Absent Today" value={displayMetric(overview.staff.absentToday)} />
          <MetricCard label="Period Attendance" value={displayMetric(overview.staff.attendancePercentage, "%")} />
          <MetricCard label="Absent 3+ Days" value={overview.staff.absentWarning} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Needs Attention Today</CardTitle>
          <Link href="/admin/management-intelligence/alerts" className="text-sm font-medium text-slate-700 hover:underline">Open Alert Center</Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {severityGroups.map((severity) => {
            const rows = alerts.rows.filter((alert) => alert.severity === severity);
            return (
              <div key={severity}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{severity === "INFO" ? "Information" : severity[0] + severity.slice(1).toLowerCase()}</h3>
                {rows.length ? (
                  <div className="flex flex-col gap-2">
                    {rows.map((alert) => (
                      <Link key={alert.id} href={alertDestination(alert)} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                        <div><p className="text-sm font-medium text-slate-900">{alert.title}</p><p className="line-clamp-2 text-xs text-slate-500">{alert.message}</p></div>
                        <div className="flex flex-col items-end gap-1"><Badge className={severity === "CRITICAL" ? "bg-red-100 text-red-700" : severity === "WARNING" ? "bg-amber-100 text-amber-700" : ""}>{severity}</Badge><span className="text-[10px] text-slate-400">{alert.status}</span></div>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No {severity.toLowerCase()} alerts. This does not imply health when source attendance is unrecorded.</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
