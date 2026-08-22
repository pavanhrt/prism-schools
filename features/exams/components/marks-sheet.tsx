"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enterMarksAction, submitForReviewAction } from "@/features/exams/actions";
import { computeGrade } from "@/features/exams/grading";
import type { ExamAttendanceStatus, ExamResult, GradeScale } from "@/types/exams";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RowState {
  marks_theory: string;
  marks_practical: string;
  attendance_status: ExamAttendanceStatus;
}

export function MarksSheet({
  examScheduleId,
  roster,
  existing,
  maxTheory,
  maxPractical,
  passMarks,
  gradeScales,
  resultStatus,
  canEnter,
}: {
  examScheduleId: string;
  roster: { student_id: string; roll_no: string | null; first_name: string; last_name: string }[];
  existing: Record<string, ExamResult>;
  maxTheory: number;
  maxPractical: number;
  passMarks: number;
  gradeScales: GradeScale[];
  resultStatus: string;
  canEnter: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const s of roster) {
      const e = existing[s.student_id];
      initial[s.student_id] = {
        marks_theory: e?.marks_theory != null ? String(e.marks_theory) : "",
        marks_practical: e?.marks_practical != null ? String(e.marks_practical) : "",
        attendance_status: e?.attendance_status ?? "present",
      };
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateRow(studentId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await enterMarksAction({
      exam_schedule_id: examScheduleId,
      entries: roster.map((s) => {
        const row = rows[s.student_id];
        return {
          student_id: s.student_id,
          marks_theory: row.marks_theory === "" ? null : Number(row.marks_theory),
          marks_practical: row.marks_practical === "" ? null : Number(row.marks_practical),
          attendance_status: row.attendance_status,
        };
      }),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const result = await submitForReviewAction(examScheduleId);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marks entry</CardTitle>
        <Badge variant="outline">{resultStatus}</Badge>
      </CardHeader>
      <CardContent>
        {!canEnter && (
          <p className="mb-4 text-sm text-amber-600">
            Read-only — you&apos;re not assigned to teach this subject for this class, or
            results are no longer in draft.
          </p>
        )}
        <div className="flex flex-col divide-y divide-slate-100">
          <div className="grid grid-cols-[2rem_1fr_7rem_7rem_8rem_5rem] gap-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Roll</span>
            <span>Name</span>
            <span>Theory</span>
            <span>Practical</span>
            <span>Attendance</span>
            <span>Grade</span>
          </div>
          {roster.map((s) => {
            const row = rows[s.student_id];
            const grade = computeGrade(
              {
                theory: row.marks_theory === "" ? null : Number(row.marks_theory),
                practical: row.marks_practical === "" ? null : Number(row.marks_practical),
                maxTheory,
                maxPractical,
                passMarks,
              },
              gradeScales,
            );
            return (
              <div
                key={s.student_id}
                className="grid grid-cols-[2rem_1fr_7rem_7rem_8rem_5rem] items-center gap-3 py-2"
              >
                <span className="font-mono text-xs text-slate-400">{s.roll_no ?? "—"}</span>
                <span className="font-medium text-slate-900">{s.first_name} {s.last_name}</span>
                <Input
                  type="number"
                  disabled={!canEnter}
                  value={row.marks_theory}
                  max={maxTheory}
                  onChange={(e) => updateRow(s.student_id, { marks_theory: e.target.value })}
                />
                <Input
                  type="number"
                  disabled={!canEnter || maxPractical === 0}
                  value={row.marks_practical}
                  max={maxPractical}
                  onChange={(e) => updateRow(s.student_id, { marks_practical: e.target.value })}
                />
                <select
                  disabled={!canEnter}
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm disabled:opacity-50"
                  value={row.attendance_status}
                  onChange={(e) =>
                    updateRow(s.student_id, { attendance_status: e.target.value as ExamAttendanceStatus })
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="medical">Medical</option>
                  <option value="late">Late</option>
                </select>
                {grade && (
                  <span className={cn("text-sm font-medium", grade.isPass ? "text-emerald-600" : "text-red-600")}>
                    {grade.grade?.grade_name ?? "—"} ({grade.percentage.toFixed(0)}%)
                  </span>
                )}
              </div>
            );
          })}
          {roster.length === 0 && (
            <p className="py-8 text-center text-slate-400">No students currently enrolled in this class.</p>
          )}
        </div>

        {canEnter && roster.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save marks"}
            </Button>
            {resultStatus === "draft" && (
              <Button variant="outline" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit for review"}
              </Button>
            )}
            {saved && !saving && !error && <span className="text-sm text-emerald-600">Saved.</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
