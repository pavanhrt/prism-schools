import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { compareSubjectProgress } from "@/features/portal/rules";
import { listExamTerms, listExams, listExamSchedules, listResultsForStudent, listGradeScales } from "@/features/exams/service";
import { computeGrade } from "@/features/exams/grading";
import { listSubjects } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STABLE_BAND_POINTS = 3;

export default async function PortalResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; term_id?: string }>;
}) {
  const { student_id, term_id } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);
  if (!active) return <p className="text-sm text-slate-500">No student linked to your account.</p>;

  const [terms, exams, schedules, results, subjects, gradeScales] = await Promise.all([
    listExamTerms(supabase),
    listExams(supabase),
    listExamSchedules(supabase),
    listResultsForStudent(supabase, active.id),
    listSubjects(supabase),
    listGradeScales(supabase),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));
  const examById = new Map(exams.map((e) => [e.id, e]));
  const scheduleById = new Map(schedules.map((s) => [s.id, s]));

  const publishedRows = results
    .map((result) => {
      const schedule = scheduleById.get(result.exam_schedule_id);
      if (!schedule || (schedule.result_status !== "published" && schedule.result_status !== "locked")) return null;
      const exam = examById.get(schedule.exam_id);
      if (!exam) return null;
      const grade = computeGrade(
        {
          theory: result.marks_theory,
          practical: result.marks_practical,
          maxTheory: schedule.max_marks_theory,
          maxPractical: schedule.max_marks_practical,
          passMarks: schedule.pass_marks,
        },
        gradeScales,
      );
      const percentage = grade && grade.totalMax > 0 ? Math.round((grade.totalMarks / grade.totalMax) * 10_000) / 100 : null;
      return { result, schedule, exam, grade, percentage };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const selectedTermId = term_id ?? terms[0]?.id;
  const visibleRows = selectedTermId ? publishedRows.filter((r) => r.exam.term_id === selectedTermId) : publishedRows;

  // Subject-level comparison — grouped strictly by explicit comparison_group
  // metadata (set by staff when creating exams), never inferred from names
  // or dates. No class/subject rank here: there is no existing parent-facing
  // ranking infrastructure, and computing one here would be a new analytics
  // feature, not an extension of what already exists.
  const bySubject = new Map<string, typeof publishedRows>();
  for (const row of publishedRows) {
    const key = row.schedule.subject_id;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(row);
  }

  const progressBySubject = new Map<string, ReturnType<typeof compareSubjectProgress>>();
  for (const [subjectId, rows] of bySubject) {
    const comparable = rows
      .filter((r) => r.exam.comparison_group && r.percentage !== null)
      .sort((a, b) => (a.exam.sequence_no ?? 0) - (b.exam.sequence_no ?? 0));
    if (comparable.length < 2) continue;
    const latest = comparable[comparable.length - 1];
    const previous = comparable[comparable.length - 2];
    if (latest.exam.comparison_group !== previous.exam.comparison_group) continue;
    progressBySubject.set(subjectId, compareSubjectProgress(previous.percentage, latest.percentage, STABLE_BAND_POINTS));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Results</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <form className="flex items-center gap-2" method="get">
        {student_id && <input type="hidden" name="student_id" value={student_id} />}
        <label htmlFor="term_id" className="text-xs text-slate-500">Term</label>
        <select id="term_id" name="term_id" defaultValue={selectedTermId} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm shadow-sm">
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="submit" className="h-9 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">Apply</button>
      </form>

      <div className="flex flex-col gap-3">
        {[...bySubject.keys()]
          .filter((subjectId) => visibleRows.some((r) => r.schedule.subject_id === subjectId))
          .map((subjectId) => {
            const rows = visibleRows.filter((r) => r.schedule.subject_id === subjectId).sort((a, b) => (a.exam.sequence_no ?? 0) - (b.exam.sequence_no ?? 0));
            const progress = progressBySubject.get(subjectId);
            return (
              <Card key={subjectId}>
                <CardHeader>
                  <CardTitle>{subjectById.get(subjectId) ?? "Subject"}</CardTitle>
                  {progress && progress.label !== "INSUFFICIENT_DATA" && (
                    <Badge variant={progress.label === "IMPROVED" ? "success" : progress.label === "DECLINED" ? "warning" : "outline"}>
                      {progress.label} {progress.differencePoints !== null ? `(${progress.differencePoints > 0 ? "+" : ""}${progress.differencePoints} pts)` : ""}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {rows.map((row) => (
                    <div key={row.result.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{row.exam.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{row.grade ? `${row.grade.totalMarks}/${row.grade.totalMax}` : "—"}</span>
                        {row.grade?.grade && (
                          <Badge variant={row.grade.isPass ? "success" : "warning"}>{row.grade.grade.grade_name}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        {visibleRows.length === 0 && <p className="py-8 text-center text-slate-400">No published results for this term.</p>}
      </div>
    </div>
  );
}
