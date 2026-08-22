import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listClasses, listSubjects } from "@/features/academics/repository";
import { SubjectsManager } from "@/features/academics/components/subjects-manager";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const [subjects, classes, canCreate, canDelete] = await Promise.all([
    listSubjects(supabase),
    listClasses(supabase),
    hasPermission("academics.create"),
    hasPermission("academics.delete"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Subjects</h1>
        <p className="text-sm text-slate-500">Subjects belong to a class and feed Exams once Phase 4 is built.</p>
      </div>
      <SubjectsManager
        initialSubjects={subjects}
        classes={classes}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
