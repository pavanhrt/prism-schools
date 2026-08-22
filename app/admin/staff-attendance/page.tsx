import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listActiveStaff, listStaffAttendanceForDate } from "@/features/staff/service";
import { StaffAttendanceSheet } from "@/features/staff/components/staff-attendance-sheet";
import type { StaffAttendanceStatus } from "@/types/staff";

export default async function StaffAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const attendanceDate = date ?? today;

  const supabase = await createClient();
  const [staff, records, canMark] = await Promise.all([
    listActiveStaff(supabase),
    listStaffAttendanceForDate(supabase, attendanceDate),
    hasPermission("staff_attendance.mark"),
  ]);

  const existing: Record<string, StaffAttendanceStatus> = {};
  for (const r of records) existing[r.staff_id] = r.status;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Staff Attendance</h1>
      </div>
      <StaffAttendanceSheet staff={staff} existing={existing} date={attendanceDate} canMark={canMark} />
    </div>
  );
}
