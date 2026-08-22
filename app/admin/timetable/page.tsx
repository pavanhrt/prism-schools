import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listTeacherProfiles, listTimetable } from "@/features/teaching/service";
import {
  listAcademicYears,
  listClasses,
  listSections,
  listSubjects,
} from "@/features/academics/repository";
import { TimetableManager } from "@/features/teaching/components/timetable-manager";

export default async function TimetablePage() {
  const supabase = await createClient();
  const [entries, teachers, classes, sections, subjects, academicYears, canCreate, canDelete] =
    await Promise.all([
      listTimetable(supabase),
      listTeacherProfiles(supabase),
      listClasses(supabase),
      listSections(supabase),
      listSubjects(supabase),
      listAcademicYears(supabase),
      hasPermission("academics.create"),
      hasPermission("academics.delete"),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Timetable</h1>
        <p className="text-sm text-slate-500">Set centrally by administration, visible to everyone.</p>
      </div>
      <TimetableManager
        initialEntries={entries}
        teachers={teachers}
        classes={classes}
        sections={sections}
        subjects={subjects}
        academicYears={academicYears}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
