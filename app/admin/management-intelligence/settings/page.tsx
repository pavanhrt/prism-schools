import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { SettingEditor } from "@/features/management-intelligence/components/settings-form";
import { CalendarOverrideForm } from "@/features/management-intelligence/components/calendar-override-form";
import { listSettings, listAcademicYears } from "@/features/management-intelligence/service";

const EDITABLE = [
  ["student_absence_warning_days", "Student absence warning", "Consecutive configured working days"],
  ["student_absence_critical_days", "Student absence critical", "Consecutive configured working days"],
  ["student_low_attendance_warning_pct", "Low attendance warning", "Percentage; values below this threshold trigger"],
  ["student_low_attendance_critical_pct", "Low attendance critical", "Percentage; values below this threshold trigger"],
  ["student_attendance_decline_points", "Attendance decline", "Percentage-point decline versus the previous comparable period"],
  ["staff_absence_warning_days", "Staff absence warning", "Consecutive configured working days; approved leave excluded"],
] as const;

export default async function IntelligenceSettingsPage() {
  if (!(await hasPermission("management_intelligence.manage_settings"))) redirect("/admin/management-intelligence");
  const supabase = await createClient();
  const [settings, academicYears] = await Promise.all([listSettings(supabase), listAcademicYears(supabase)]);
  const currentYear = academicYears.find((row) => row.is_current);
  const byKey = new Map(settings.map((row) => [row.setting_key, row]));
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-xl font-semibold text-slate-900">Intelligence Settings</h1><p className="text-sm text-slate-500">Server-validated thresholds used by deterministic attendance rules.</p></div>
      <Card><CardHeader><CardTitle>Attendance thresholds</CardTitle></CardHeader><CardContent>
        {EDITABLE.map(([key, label, suffix]) => <SettingEditor key={key} settingKey={key} label={label} value={Number(byKey.get(key)?.numeric_value ?? 0)} suffix={suffix} />)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Working-day handling</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">
        Sunday is seeded as the recurring weekly off-day. Date-specific rows in <code className="rounded bg-slate-100 px-1">academic_calendar_days</code> override weekly rules for holidays, closures, or exceptional working days. Missing attendance on a working day is never converted into an absence.
        {currentYear ? <div className="mt-4 border-t border-slate-100 pt-4"><CalendarOverrideForm academicYearId={currentYear.id} /></div> : <p className="mt-3 text-amber-700">Set a current academic year before configuring calendar overrides.</p>}
      </CardContent></Card>
    </div>
  );
}
