import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listTeacherAssignments, listTeacherProfiles } from "@/features/teaching/service";
import {
  listAcademicYears,
  listClasses,
  listSections,
  listSubjects,
} from "@/features/academics/repository";
import { TeacherAssignmentsManager } from "@/features/teaching/components/teacher-assignments-manager";

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient();
  const [assignments, teachers, classes, sections, subjects, academicYears, canManage] =
    await Promise.all([
      listTeacherAssignments(supabase),
      listTeacherProfiles(supabase),
      listClasses(supabase),
      listSections(supabase),
      listSubjects(supabase),
      listAcademicYears(supabase),
      hasPermission("teachers.assign"),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Teacher Assignments</h1>
        <p className="text-sm text-slate-500">
          Who teaches what, where — this is what actually scopes a teacher&apos;s access to
          lesson plans, homework, and attendance, not just their role.
        </p>
      </div>
      <TeacherAssignmentsManager
        initialAssignments={assignments}
        teachers={teachers}
        classes={classes}
        sections={sections}
        subjects={subjects}
        academicYears={academicYears}
        canManage={canManage}
      />
    </div>
  );
}
