"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markStaffAttendanceAction } from "@/features/staff/actions";
import type { Staff, StaffAttendanceStatus } from "@/types/staff";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_OPTIONS: { value: StaffAttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
  { value: "leave", label: "Leave" },
];

const STATUS_STYLE: Record<StaffAttendanceStatus, string> = {
  present: "bg-emerald-600 text-white border-emerald-600",
  absent: "bg-red-600 text-white border-red-600",
  late: "bg-amber-500 text-white border-amber-500",
  half_day: "bg-slate-500 text-white border-slate-500",
  leave: "bg-sky-500 text-white border-sky-500",
};

export function StaffAttendanceSheet({
  staff,
  existing,
  date,
  canMark,
}: {
  staff: Staff[];
  existing: Record<string, StaffAttendanceStatus>;
  date: string;
  canMark: boolean;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(date);
  const [statuses, setStatuses] = useState<Record<string, StaffAttendanceStatus>>(() => {
    const initial: Record<string, StaffAttendanceStatus> = {};
    for (const s of staff) initial[s.id] = existing[s.id] ?? "present";
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function loadDate() {
    router.push(`/admin/staff-attendance?date=${selectedDate}`);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await markStaffAttendanceAction({
      attendance_date: date,
      entries: staff.map((s) => ({ staff_id: s.id, status: statuses[s.id] })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff attendance</CardTitle>
        <div className="flex items-center gap-2">
          <Input type="date" className="h-8 w-40" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <Button size="sm" variant="outline" onClick={loadDate}>Load</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-slate-100">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 py-2.5">
              <span className="font-medium text-slate-900">{s.first_name} {s.last_name}</span>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!canMark}
                    onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                      statuses[s.id] === opt.value ? STATUS_STYLE[opt.value] : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {staff.length === 0 && <p className="py-8 text-center text-slate-400">No active staff.</p>}
        </div>

        {canMark && staff.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save attendance"}</Button>
            {saved && !saving && !error && <span className="text-sm text-emerald-600">Saved.</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
