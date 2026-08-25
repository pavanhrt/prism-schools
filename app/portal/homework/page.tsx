import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listHomework } from "@/features/teaching/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listSubjects } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Filter = "pending" | "overdue" | "all";

export default async function PortalHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; filter?: string }>;
}) {
  const { student_id, filter } = await searchParams;
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
  const forStudent = currentEnrollment
    ? allHomework.filter(
        (h) => h.class_id === currentEnrollment.class_id && h.section_id === currentEnrollment.section_id,
      )
    : [];
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  const today = new Date().toISOString().slice(0, 10);
  const activeFilter: Filter = filter === "overdue" || filter === "all" ? filter : "pending";
  const homework = forStudent
    .filter((h) => {
      if (activeFilter === "pending") return h.submission_date >= today;
      if (activeFilter === "overdue") return h.submission_date < today;
      return true;
    })
    .sort((a, b) => a.submission_date.localeCompare(b.submission_date));

  const filterLink = (f: Filter) => `/portal/homework?${new URLSearchParams({ ...(student_id ? { student_id } : {}), filter: f }).toString()}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Homework</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <div className="flex gap-2">
        {(["pending", "overdue", "all"] as Filter[]).map((f) => (
          <Link
            key={f}
            href={filterLink(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize",
              activeFilter === f ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50",
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {homework.map((h) => {
          const overdue = h.submission_date < today;
          return (
            <Card key={h.id}>
              <CardHeader>
                <CardTitle>{subjectById.get(h.subject_id) ?? "Subject"}</CardTitle>
                <Badge variant={overdue ? "warning" : "outline"}>Due {h.submission_date}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{h.description}</p>
                <p className="mt-1 text-xs text-slate-400">Assigned {h.homework_date}</p>
              </CardContent>
            </Card>
          );
        })}
        {homework.length === 0 && <p className="py-8 text-center text-slate-400">No homework here.</p>}
      </div>
    </div>
  );
}
