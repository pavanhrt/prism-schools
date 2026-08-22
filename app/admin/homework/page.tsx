import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listHomework } from "@/features/teaching/service";
import {
  listAcademicYears,
  listClasses,
  listSections,
  listSubjects,
} from "@/features/academics/repository";
import { HomeworkManager } from "@/features/teaching/components/homework-manager";

export default async function HomeworkPage() {
  const supabase = await createClient();
  const [homework, classes, sections, subjects, academicYears, canCreate] = await Promise.all([
    listHomework(supabase),
    listClasses(supabase),
    listSections(supabase),
    listSubjects(supabase),
    listAcademicYears(supabase),
    hasPermission("homework.create"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Homework</h1>
      </div>
      <HomeworkManager
        initialHomework={homework}
        classes={classes}
        sections={sections}
        subjects={subjects}
        academicYears={academicYears}
        canCreate={canCreate}
      />
    </div>
  );
}
