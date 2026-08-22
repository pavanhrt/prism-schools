import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { getExamSchedule, listGradeScales, listResultsForSchedule } from "@/features/exams/service";
import { listRosterForClass } from "@/features/students/service";
import { MarksSheet } from "@/features/exams/components/marks-sheet";
import type { ExamResult } from "@/types/exams";

export default async function MarksEntryPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const supabase = await createClient();

  const schedule = await getExamSchedule(supabase, scheduleId);
  if (!schedule) notFound();

  const [roster, results, gradeScales, canEnterAtAll, { data: isAdmin }, { data: canEnterHere }] =
    await Promise.all([
      listRosterForClass(supabase, schedule.class_id),
      listResultsForSchedule(supabase, scheduleId),
      listGradeScales(supabase),
      hasPermission("exams.enter_marks"),
      supabase.rpc("is_admin"),
      supabase.rpc("can_enter_marks", { p_exam_schedule_id: scheduleId }),
    ]);

  const existing: Record<string, ExamResult> = {};
  for (const r of results) existing[r.student_id] = r;

  const canEnter = canEnterAtAll && Boolean(isAdmin || canEnterHere);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Marks Entry</h1>
        <p className="text-sm text-slate-500">
          Max marks: {schedule.max_marks_theory} theory
          {schedule.max_marks_practical > 0 ? ` + ${schedule.max_marks_practical} practical` : ""} ·
          Pass mark {schedule.pass_marks}
        </p>
      </div>
      <MarksSheet
        examScheduleId={scheduleId}
        roster={roster}
        existing={existing}
        maxTheory={schedule.max_marks_theory}
        maxPractical={schedule.max_marks_practical}
        passMarks={schedule.pass_marks}
        gradeScales={gradeScales}
        resultStatus={schedule.result_status}
        canEnter={canEnter}
      />
    </div>
  );
}
