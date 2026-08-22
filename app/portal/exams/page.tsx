import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listExamSchedules, listGradeScales, listResultsForStudent } from "@/features/exams/service";
import { listExams } from "@/features/exams/service";
import { listSubjects } from "@/features/academics/repository";
import { computeGrade } from "@/features/exams/grading";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function PortalExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { students, active } = await resolveActiveStudent(supabase, user.id, student_id);
  if (!active) return <p className="text-sm text-slate-500">No student linked to your account.</p>;

  const [enrollments, schedules, exams, subjects, results, gradeScales] = await Promise.all([
    listEnrollmentsForStudent(supabase, active.id),
    listExamSchedules(supabase),
    listExams(supabase),
    listSubjects(supabase),
    listResultsForStudent(supabase, active.id),
    listGradeScales(supabase),
  ]);

  const currentClassId = enrollments.find((e) => e.is_current)?.class_id;
  const examById = new Map(exams.map((e) => [e.id, e]));
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = schedules
    .filter((s) => s.class_id === currentClassId && s.exam_date >= today)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  const resultsWithSchedule = results
    .map((r) => ({ result: r, schedule: schedules.find((s) => s.id === r.exam_schedule_id) }))
    .filter((r) => r.schedule);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Exams</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Date</TH><TH>Subject</TH><TH>Exam</TH></TR></THead>
            <TBody>
              {upcoming.map((s) => (
                <TR key={s.id}>
                  <TD>{s.exam_date}</TD>
                  <TD>{subjectById.get(s.subject_id) ?? "—"}</TD>
                  <TD>{examById.get(s.exam_id)?.name ?? "—"}</TD>
                </TR>
              ))}
              {upcoming.length === 0 && <TR><TD colSpan={3} className="py-6 text-center text-slate-400">Nothing scheduled.</TD></TR>}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Results</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Subject</TH><TH>Exam</TH><TH className="text-right">Marks</TH><TH>Grade</TH></TR></THead>
            <TBody>
              {resultsWithSchedule.map(({ result, schedule }) => {
                if (!schedule) return null;
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
                return (
                  <TR key={result.id}>
                    <TD>{subjectById.get(schedule.subject_id) ?? "—"}</TD>
                    <TD>{examById.get(schedule.exam_id)?.name ?? "—"}</TD>
                    <TD className="text-right">{grade ? `${grade.totalMarks}/${grade.totalMax}` : "—"}</TD>
                    <TD>
                      {grade?.grade ? (
                        <Badge variant={grade.isPass ? "success" : "warning"}>{grade.grade.grade_name}</Badge>
                      ) : "—"}
                    </TD>
                  </TR>
                );
              })}
              {resultsWithSchedule.length === 0 && (
                <TR><TD colSpan={4} className="py-6 text-center text-slate-400">No published results yet.</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
