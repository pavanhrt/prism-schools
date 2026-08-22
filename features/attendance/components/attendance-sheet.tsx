"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAttendanceAction } from "@/features/attendance/actions";
import type { AttendanceStatus } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-600 text-white border-emerald-600",
  absent: "bg-red-600 text-white border-red-600",
  late: "bg-amber-500 text-white border-amber-500",
  half_day: "bg-slate-500 text-white border-slate-500",
};

export function AttendanceSheet({
  roster,
  existing,
  academicYearId,
  classId,
  sectionId,
  date,
  className,
  sectionName,
  canMark,
}: {
  roster: { student_id: string; roll_no: string | null; first_name: string; last_name: string }[];
  existing: Record<string, AttendanceStatus>;
  academicYearId: string;
  classId: string;
  sectionId: string;
  date: string;
  className: string;
  sectionName: string;
  canMark: boolean;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const s of roster) initial[s.student_id] = existing[s.student_id] ?? "present";
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await markAttendanceAction({
      academic_year_id: academicYearId,
      class_id: classId,
      section_id: sectionId,
      attendance_date: date,
      entries: roster.map((s) => ({ student_id: s.student_id, status: statuses[s.student_id] })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAt(Date.now());
    router.refresh();
  }

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {className} — {sectionName} · {date}
        </CardTitle>
        <span className="text-sm text-slate-500">
          {presentCount}/{roster.length} present
        </span>
      </CardHeader>
      <CardContent>
        {roster.length === 0 ? (
          <p className="py-8 text-center text-slate-400">
            No students currently enrolled in this section.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {roster.map((s) => (
              <div key={s.student_id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="flex items-baseline gap-3">
                  <span className="w-10 font-mono text-xs text-slate-400">{s.roll_no ?? "—"}</span>
                  <span className="font-medium text-slate-900">{s.first_name} {s.last_name}</span>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!canMark}
                      onClick={() => setStatuses((prev) => ({ ...prev, [s.student_id]: opt.value }))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                        statuses[s.student_id] === opt.value
                          ? STATUS_STYLE[opt.value]
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {canMark && roster.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save attendance"}
            </Button>
            {savedAt && !saving && !error && (
              <span className="text-sm text-emerald-600">Saved.</span>
            )}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        )}
        {!canMark && (
          <p className="mt-4 text-sm text-amber-600">
            You&apos;re viewing this section&apos;s attendance but aren&apos;t its class teacher, so
            marking is read-only for you.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
