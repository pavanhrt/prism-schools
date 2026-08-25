import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { resolveActiveStudent } from "@/features/portal/service";
import { listEnrollmentsForStudent } from "@/features/students/service";
import { listClasses, listSections } from "@/features/academics/repository";
import { StudentSwitcher } from "@/features/portal/components/student-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default async function PortalProfilePage({
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

  const [enrollments, classes, sections] = await Promise.all([
    listEnrollmentsForStudent(supabase, active.id),
    listClasses(supabase),
    listSections(supabase),
  ]);
  const currentEnrollment = enrollments.find((e) => e.is_current);
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Student Profile</h1>
        <StudentSwitcher students={students} activeId={active.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>{active.first_name} {active.last_name}</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Admission no." value={active.admission_no} />
            <Field label="Status" value={active.status} />
            <Field label="Class" value={currentEnrollment ? `${classById.get(currentEnrollment.class_id) ?? ""} ${sectionById.get(currentEnrollment.section_id) ?? ""}` : null} />
            <Field label="Roll no." value={currentEnrollment?.roll_no} />
            <Field label="Date of birth" value={active.dob} />
            <Field label="Gender" value={active.gender} />
            <Field label="Blood group" value={active.blood_group} />
            <Field label="Admission date" value={active.admission_date} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Father's name" value={active.father_name} />
            <Field label="Mother's name" value={active.mother_name} />
            <Field label="Guardian phone" value={active.guardian_phone} />
            <Field label="Email" value={active.email} />
            <Field label="Phone" value={active.phone} />
            <Field label="Address" value={active.address} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
