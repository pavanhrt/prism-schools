import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { AlertActions } from "@/features/management-intelligence/components/alert-actions";
import { listAlerts, listClassesAndSections } from "@/features/management-intelligence/service";

type Params = { severity?: string; category?: string; status?: string; class_id?: string; from?: string; to?: string; page?: string };

export default async function AlertCenterPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [result, academics, canManage] = await Promise.all([
    listAlerts(supabase, {
      severity: params.severity,
      category: params.category,
      status: params.status,
      classId: params.class_id,
      from: params.from,
      to: params.to,
      page: Number(params.page ?? "1") || 1,
    }),
    listClassesAndSections(supabase),
    hasPermission("management_intelligence.manage_alerts"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-xl font-semibold text-slate-900">Alert Center</h1><p className="text-sm text-slate-500">Explainable rule outcomes with acknowledgement, resolution, dismissal, and lifecycle audit data.</p></div>
      <Card><CardContent><form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        <label className="text-xs font-medium text-slate-600">Severity<select name="severity" defaultValue={params.severity ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option>CRITICAL</option><option>WARNING</option><option>INFO</option></select></label>
        <label className="text-xs font-medium text-slate-600">Category<select name="category" defaultValue={params.category ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option>{["ATTENDANCE","STAFF","ACADEMICS","TIMETABLE","PERFORMANCE","FEES","OPERATIONS"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Status<select name="status" defaultValue={params.status ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option>{["OPEN","ACKNOWLEDGED","RESOLVED","DISMISSED"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Class<select name="class_id" defaultValue={params.class_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option>{academics.classes.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">From<input name="from" type="date" defaultValue={params.from} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
        <label className="text-xs font-medium text-slate-600">To<input name="to" type="date" defaultValue={params.to} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
        <Button type="submit" className="self-end">Apply filters</Button>
      </form></CardContent></Card>
      <Table><THead><TR><TH>Alert</TH><TH>Rule explanation</TH><TH>Severity</TH><TH>Status</TH><TH>Detected</TH><TH>Action</TH></TR></THead><TBody>
        {result.rows.map((alert) => <TR key={alert.id}>
          <TD><p className="font-medium text-slate-900">{alert.title}</p><p className="text-xs text-slate-400">{alert.category} · {alert.alert_type}</p></TD>
          <TD className="max-w-lg"><p className="text-xs leading-5 text-slate-600">{alert.message}</p><p className="mt-1 text-xs text-slate-400">Rule: {alert.rule_key} · Current: {alert.current_value ?? "n/a"} · Threshold: {alert.threshold_value ?? "n/a"} · Period: {alert.period_start ?? "n/a"} to {alert.period_end ?? "n/a"}</p></TD>
          <TD><Badge className={alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" : alert.severity === "WARNING" ? "bg-amber-100 text-amber-700" : ""}>{alert.severity}</Badge></TD>
          <TD>{alert.status}</TD><TD className="text-xs">First {alert.first_detected_at.slice(0, 10)}<br />Last {alert.last_detected_at.slice(0, 10)}</TD>
          <TD>{canManage ? <AlertActions alertId={alert.id} status={alert.status} /> : "View only"}</TD>
        </TR>)}
        {!result.rows.length && <TR><TD colSpan={6} className="py-8 text-center text-slate-500">No alerts match these filters. If attendance has not been recorded, this is not evidence that conditions are healthy.</TD></TR>}
      </TBody></Table>
      <p className="text-sm text-slate-500">{result.count} alerts · page {result.page}</p>
    </div>
  );
}
