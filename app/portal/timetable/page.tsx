import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listTimetable } from "@/features/teaching/service";
import { listSubjects } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

export default async function PortalTimetablePage({
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

  const enrollments = await listEnrollmentsForStudent(supabase, active.id);
  const currentEnrollment = enrollments.find((e) => e.is_current);

  const [timetable, subjects] = await Promise.all([
    currentEnrollment ? listTimetable(supabase, currentEnrollment.class_id, currentEnrollment.section_id) : Promise.resolve([]),
    listSubjects(supabase),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Timetable</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      {!currentEnrollment && <p className="text-sm text-slate-400">No current class enrollment found.</p>}

      {DAYS.map((day) => {
        const entries = timetable
          .filter((t) => t.day_of_week === day)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (entries.length === 0) return null;
        return (
          <Card key={day}>
            <CardHeader><CardTitle>{DAY_LABELS[day]}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {entries.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-slate-700">{subjectById.get(t.subject_id) ?? "—"}</span>
                  <span className="text-slate-500">{t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}{t.room_no ? ` · ${t.room_no}` : ""}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {currentEnrollment && timetable.length === 0 && <p className="py-8 text-center text-slate-400">No timetable published yet.</p>}
    </div>
  );
}
