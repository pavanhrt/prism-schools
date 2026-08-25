import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { SettingEditor } from "@/features/management-intelligence/components/settings-form";
import { CalendarOverrideForm } from "@/features/management-intelligence/components/calendar-override-form";
import { WeeklyOffDaysForm } from "@/features/management-intelligence/components/weekly-off-days-form";
import { listSettings, listAcademicYears, listWeeklyOffDays } from "@/features/management-intelligence/service";

const EDITABLE = [
  ["student_absence_warning_days", "Student absence warning", "Consecutive configured working days"],
  ["student_absence_critical_days", "Student absence critical", "Consecutive configured working days"],
  ["student_low_attendance_warning_pct", "Low attendance warning", "Percentage; values below this threshold trigger"],
  ["student_low_attendance_critical_pct", "Low attendance critical", "Percentage; values below this threshold trigger"],
  ["student_attendance_decline_points", "Attendance decline", "Percentage-point decline versus the previous comparable period"],
  ["staff_absence_warning_days", "Staff absence warning", "Consecutive configured working days; approved leave excluded"],
] as const;

const ACADEMIC_EDITABLE = [
  ["academic_lag_slightly_behind_days", "Slightly behind", "Minimum working-day lag on an overdue lesson plan"],
  ["academic_lag_warning_days", "Warning", "Minimum working-day lag"],
  ["academic_lag_critical_days", "Critical", "Minimum working-day lag"],
] as const;

const PERFORMANCE_EDITABLE = [
  ["performance_change_points", "Improving/Declining", "Percentage-point change between comparable exam results"],
  ["performance_strong_change_points", "Strongly improving/declining", "Percentage-point change between comparable exam results"],
  ["performance_attention_score_pct", "Attention threshold", "Subject percentage below which a result requires attention"],
] as const;

const FEE_EDITABLE = [
  ["fee_overdue_warning_days", "Overdue warning", "Days past due date"],
  ["fee_overdue_critical_days", "Overdue critical", "Days past due date"],
  ["fee_significant_overdue_amount", "Significant overdue amount", "Outstanding amount above which an overdue alert is significant"],
  ["fee_collection_rate_warning_pct", "Collection rate warning", "Collection percentage below which a warning is raised"],
] as const;

const HEALTH_WEIGHT_EDITABLE = [
  ["health_weight_student_attendance", "Student Attendance", "Weight (%) of the School Health Score"],
  ["health_weight_academic_progress", "Academic Progress", "Weight (%) of the School Health Score"],
  ["health_weight_performance", "Student Performance", "Weight (%) of the School Health Score"],
  ["health_weight_staff_attendance", "Staff Attendance", "Weight (%) of the School Health Score"],
  ["health_weight_delivery", "Timetable/Delivery", "Weight (%) of the School Health Score"],
  ["health_weight_fees", "Fee Collection", "Weight (%) of the School Health Score"],
] as const;

export default async function IntelligenceSettingsPage() {
  if (!(await hasPermission("management_intelligence.manage_settings"))) redirect("/admin/management-intelligence");
  const supabase = await createClient();
  const [settings, academicYears, weeklyOffDays] = await Promise.all([listSettings(supabase), listAcademicYears(supabase), listWeeklyOffDays(supabase)]);
  const currentYear = academicYears.find((row) => row.is_current);
  const byKey = new Map(settings.map((row) => [row.setting_key, row]));
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-xl font-semibold text-slate-900">Intelligence Settings</h1><p className="text-sm text-slate-500">Server-validated thresholds used by deterministic attendance rules.</p></div>
      <Card><CardHeader><CardTitle>Attendance thresholds</CardTitle></CardHeader><CardContent>
        {EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Academic delivery lag thresholds</CardTitle></CardHeader><CardContent>
        {ACADEMIC_EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Performance trend thresholds</CardTitle></CardHeader><CardContent>
        {PERFORMANCE_EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Fee thresholds</CardTitle></CardHeader><CardContent>
        {FEE_EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>School Health Score weights</CardTitle></CardHeader><CardContent>
        <p className="mb-2 text-xs text-slate-500">Weights should sum to 100. If a component has no data, its weight is excluded and the rest are re-normalized rather than scored as zero.</p>
        {HEALTH_WEIGHT_EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Working-day handling</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">
        Choose recurring weekly off-days below. Sunday is editable like every other day. Date-specific rows in <code className="rounded bg-slate-100 px-1">academic_calendar_days</code> override weekly rules for holidays, closures, or exceptional working days. Missing attendance on a working day is never converted into an absence.
        <div className="mt-4 border-t border-slate-100 pt-4"><WeeklyOffDaysForm initialDays={weeklyOffDays} /></div>
        {currentYear ? <div className="mt-4 border-t border-slate-100 pt-4"><CalendarOverrideForm academicYearId={currentYear.id} /></div> : <p className="mt-3 text-amber-700">Set a current academic year before configuring calendar overrides.</p>}
      </CardContent></Card>
    </div>
  );
}
