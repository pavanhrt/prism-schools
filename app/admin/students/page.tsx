import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listCurrentEnrollments, listStudents } from "@/features/students/service";
import { listClasses, listSections } from "@/features/academics/repository";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "outline"> = {
  active: "success",
  inactive: "outline",
  passed_out: "default",
  struck_off: "warning",
};

export default async function StudentsPage() {
  const supabase = await createClient();
  const [students, enrollments, classes, sections, canCreate] = await Promise.all([
    listStudents(supabase),
    listCurrentEnrollments(supabase),
    listClasses(supabase),
    listSections(supabase),
    hasPermission("students.create"),
  ]);

  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const sectionById = new Map(sections.map((s) => [s.id, s.name]));
  const enrollmentByStudent = new Map(enrollments.map((e) => [e.student_id, e]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">
            Admitted students, with their current class/section — see the student for
            full enrollment history.
          </p>
        </div>
        {canCreate && (
          <Link href="/admin/students/new" className={buttonVariants({})}>
            Add student (walk-in)
          </Link>
        )}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Admission no</TH>
            <TH>Name</TH>
            <TH>Class</TH>
            <TH>Section</TH>
            <TH>Roll no</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {students.map((s) => {
            const enrollment = enrollmentByStudent.get(s.id);
            return (
              <TR key={s.id}>
                <TD>
                  <Link href={`/admin/students/${s.id}`} className="font-medium text-slate-900 underline">
                    {s.admission_no}
                  </Link>
                </TD>
                <TD>{s.first_name} {s.last_name}</TD>
                <TD>{enrollment ? classById.get(enrollment.class_id) ?? "—" : "—"}</TD>
                <TD>{enrollment ? sectionById.get(enrollment.section_id) ?? "—" : "—"}</TD>
                <TD>{enrollment?.roll_no ?? "—"}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace("_", " ")}</Badge>
                </TD>
              </TR>
            );
          })}
          {students.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-slate-400">
                No students yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
