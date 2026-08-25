import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getFeeIntelligence, listAcademicYears, listClassesAndSections } from "@/features/management-intelligence/service";
import { listFeeTypes } from "@/features/fees/service";
import { MetricCard } from "@/features/management-intelligence/components/metric-card";
import type { AlertSeverity } from "@/features/management-intelligence/types";

type Params = {
  academic_year_id?: string;
  class_id?: string;
  section_id?: string;
  fee_type_id?: string;
  due_from?: string;
  due_to?: string;
  severity?: AlertSeverity;
  page?: string;
};

function pageHref(params: Record<string, string | undefined>, page: number): string {
  const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  query.set("page", String(page));
  return query.toString();
}

export default async function FeeIntelligencePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [analytics, academicYears, academics, feeTypes] = await Promise.all([
    getFeeIntelligence(supabase, {
      academicYearId: params.academic_year_id,
      classId: params.class_id,
      sectionId: params.section_id,
      feeTypeId: params.fee_type_id,
      dueDateFrom: params.due_from,
      dueDateTo: params.due_to,
      overdueSeverity: params.severity,
      overduePage: Number(params.page ?? "1") || 1,
    }),
    listAcademicYears(supabase),
    listClassesAndSections(supabase),
    listFeeTypes(supabase),
  ]);

  const { summary, classCollection, feeTypeCollection, monthlyCollection, overdueStudentsPage } = analytics;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Fee Intelligence</h1>
        <p className="text-sm text-slate-500">Balances are derived from the payment ledger, never a stored total. As of {analytics.today}.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Total Invoiced" value={summary.totalInvoiced} />
        <MetricCard label="Collected" value={summary.totalCollected} />
        <MetricCard label="Outstanding" value={summary.outstanding} />
        <MetricCard label="Collection %" value={summary.collectionPercentage === null ? "Not recorded" : `${summary.collectionPercentage}%`} />
        <MetricCard label="Overdue Amount" value={summary.overdueAmount} />
        <MetricCard label="Students Overdue" value={summary.studentsWithOverdue} />
        <MetricCard label="Fee Data Coverage" value={summary.dataCoverage.replace(/_/g, " ")} note={`${summary.invoiceCount} invoices`} />
      </div>

      <Card><CardContent>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="text-xs font-medium text-slate-600">Academic year<select name="academic_year_id" defaultValue={analytics.academicYear?.id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm">{academicYears.map((item) => <option key={item.id} value={item.id}>{item.year_label}{item.is_current ? " (current)" : ""}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Class<select name="class_id" defaultValue={params.class_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All classes</option>{academics.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Section<select name="section_id" defaultValue={params.section_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All sections</option>{academics.sections.filter((s) => !params.class_id || s.class_id === params.class_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Fee type<select name="fee_type_id" defaultValue={params.fee_type_id ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All fee types</option>{feeTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Due from<input name="due_from" type="date" defaultValue={params.due_from} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Due to<input name="due_to" type="date" defaultValue={params.due_to} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" /></label>
          <label className="text-xs font-medium text-slate-600">Overdue severity<select name="severity" defaultValue={params.severity ?? ""} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="">All</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option></select></label>
          <Button type="submit" className="self-end">Apply filters</Button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Due from/to filters invoice due dates. Monthly Collection below is always grouped by payment date, independently of this filter.</p>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Class Collection</CardTitle></CardHeader>
        <CardContent>
          <Table><THead><TR><TH>Class</TH><TH>Section</TH><TH>Invoiced</TH><TH>Collected</TH><TH>Outstanding</TH><TH>Collection %</TH></TR></THead><TBody>
            {classCollection.map((row) => <TR key={`${row.classId}-${row.sectionId}`}><TD>{row.className}</TD><TD>{row.sectionName}</TD><TD>{row.invoiced}</TD><TD>{row.collected}</TD><TD>{row.outstanding}</TD><TD>{row.collectionPercentage ?? "—"}</TD></TR>)}
            {!classCollection.length && <TR><TD colSpan={6} className="py-6 text-center text-slate-500">No invoices in this scope yet.</TD></TR>}
          </TBody></Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fee-Type Collection</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Fee Type</TH><TH>Invoiced</TH></TR></THead><TBody>
              {feeTypeCollection.map((row) => <TR key={row.feeTypeId}><TD>{row.feeTypeName}</TD><TD>{row.invoiced}</TD></TR>)}
              {!feeTypeCollection.length && <TR><TD colSpan={2} className="py-6 text-center text-slate-500">No fee-type data yet.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Collection</CardTitle></CardHeader>
          <CardContent>
            <Table><THead><TR><TH>Month</TH><TH>Collected</TH></TR></THead><TBody>
              {monthlyCollection.map((row) => <TR key={row.month}><TD>{row.month}</TD><TD>{row.collected}</TD></TR>)}
              {!monthlyCollection.length && <TR><TD colSpan={2} className="py-6 text-center text-slate-500">No verified payments yet.</TD></TR>}
            </TBody></Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Overdue Students</CardTitle></CardHeader>
        <CardContent>
          <Table><THead><TR><TH>Student</TH><TH>Class</TH><TH>Invoice</TH><TH>Due Date</TH><TH>Overdue Days</TH><TH>Balance</TH><TH>Severity</TH></TR></THead><TBody>
            {overdueStudentsPage.rows.map((row) => (
              <TR key={row.invoiceId}>
                <TD><Link href={`/admin/students/${row.studentId}`} className="font-medium text-slate-900 hover:underline">{row.studentName}</Link><p className="text-xs text-slate-400">{row.admissionNo}</p></TD>
                <TD>{row.className} · {row.sectionName}</TD>
                <TD>{row.invoiceNo}</TD>
                <TD>{row.dueDate}</TD>
                <TD>{row.overdueDays}</TD>
                <TD>{row.balance}</TD>
                <TD><Badge className={row.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{row.severity}</Badge></TD>
              </TR>
            ))}
            {!overdueStudentsPage.rows.length && <TR><TD colSpan={7} className="py-8 text-center text-slate-500">No overdue balances in this scope.</TD></TR>}
          </TBody></Table>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{overdueStudentsPage.totalCount} overdue · page {overdueStudentsPage.page}</span>
            <div className="flex gap-2">
              {overdueStudentsPage.page > 1 && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${pageHref(params, overdueStudentsPage.page - 1)}`}>Previous</Link>}
              {overdueStudentsPage.page * overdueStudentsPage.pageSize < overdueStudentsPage.totalCount && (
                <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`?${pageHref(params, overdueStudentsPage.page + 1)}`}>Next</Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
