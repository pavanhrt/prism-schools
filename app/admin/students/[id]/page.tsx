import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getStudent,
  listEnrollmentsForStudent,
  listGuardiansForStudent,
} from "@/features/students/service";
import { listClasses, listSections, listAcademicYears } from "@/features/academics/repository";
import { hasPermission } from "@/lib/permissions";
import { GuardiansPanel } from "@/features/students/components/guardians-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [student, enrollments, classes, sections, academicYears, guardians, canEdit] = await Promise.all([
    getStudent(supabase, id),
    listEnrollmentsForStudent(supabase, id),
    listClasses(supabase),
    listSections(supabase),
    listAcademicYears(supabase),
    listGuardiansForStudent(supabase, id),
    hasPermission("students.edit"),
  ]);

  if (!student) notFound();

  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));
  const yearById = new Map(academicYears.map((y) => [y.id, y.year_label]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-slate-500">
          {student.admission_no} · admitted {student.admission_date}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Date of birth</dt>
              <dd className="text-slate-900">{student.dob}</dd>
              <dt className="text-slate-500">Gender</dt>
              <dd className="text-slate-900">{student.gender}</dd>
              <dt className="text-slate-500">Blood group</dt>
              <dd className="text-slate-900">{student.blood_group ?? "—"}</dd>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-900">{student.phone ?? "—"}</dd>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{student.email ?? "—"}</dd>
              <dt className="text-slate-500">Father</dt>
              <dd className="text-slate-900">{student.father_name ?? "—"}</dd>
              <dt className="text-slate-500">Mother</dt>
              <dd className="text-slate-900">{student.mother_name ?? "—"}</dd>
              <dt className="text-slate-500">Guardian phone</dt>
              <dd className="text-slate-900">{student.guardian_phone ?? "—"}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge variant={student.status === "active" ? "success" : "outline"}>
                  {student.status.replace("_", " ")}
                </Badge>
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Year</TH>
                  <TH>Class</TH>
                  <TH>Section</TH>
                  <TH>Roll</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {enrollments.map((e) => (
                  <TR key={e.id}>
                    <TD>{yearById.get(e.academic_year_id) ?? "—"}</TD>
                    <TD>{classById.get(e.class_id) ?? "—"}</TD>
                    <TD>{sectionById.get(e.section_id) ?? "—"}</TD>
                    <TD>{e.roll_no ?? "—"}</TD>
                    <TD>
                      {e.is_current ? (
                        <Badge variant="success">current</Badge>
                      ) : (
                        <Badge variant="outline">{e.status}</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
                {enrollments.length === 0 && (
                  <TR>
                    <TD colSpan={5} className="py-6 text-center text-slate-400">
                      No enrollment records.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <GuardiansPanel studentId={id} studentUserId={student.user_id} guardians={guardians} />
      )}
    </div>
  );
}
