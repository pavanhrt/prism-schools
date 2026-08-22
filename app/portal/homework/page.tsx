import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listHomework } from "@/features/teaching/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listSubjects } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalHomeworkPage({
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

  // RLS's is_own_class_section() scopes this to the caller's own children,
  // but a parent with multiple children still gets every linked child's
  // homework back — filter down to the one selected in the switcher.
  const [allHomework, enrollments, subjects] = await Promise.all([
    listHomework(supabase),
    listEnrollmentsForStudent(supabase, active.id),
    listSubjects(supabase),
  ]);
  const currentEnrollment = enrollments.find((e) => e.is_current);
  const homework = currentEnrollment
    ? allHomework.filter(
        (h) => h.class_id === currentEnrollment.class_id && h.section_id === currentEnrollment.section_id,
      )
    : [];
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Homework</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <div className="flex flex-col gap-3">
        {homework.map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <CardTitle>{subjectById.get(h.subject_id) ?? "Subject"}</CardTitle>
              <span className="text-xs text-slate-500">Due {h.submission_date}</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{h.description}</p>
              <p className="mt-1 text-xs text-slate-400">Assigned {h.homework_date}</p>
            </CardContent>
          </Card>
        ))}
        {homework.length === 0 && <p className="py-8 text-center text-slate-400">No homework assigned.</p>}
      </div>
    </div>
  );
}
