import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listLessonPlans } from "@/features/teaching/service";
import { listAcademicYears, listClasses, listSubjects } from "@/features/academics/repository";
import { LessonPlansManager } from "@/features/teaching/components/lesson-plans-manager";

export default async function LessonPlansPage() {
  const supabase = await createClient();
  const [plans, classes, subjects, academicYears, canCreate, canEdit] = await Promise.all([
    listLessonPlans(supabase),
    listClasses(supabase),
    listSubjects(supabase),
    listAcademicYears(supabase),
    hasPermission("lesson_plans.create"),
    hasPermission("lesson_plans.edit"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Lesson Plans</h1>
        <p className="text-sm text-slate-500">
          A teacher can only add or advance plans for classes/subjects they&apos;re
          actually assigned to teach — enforced in Postgres, not just hidden in the UI.
        </p>
      </div>
      <LessonPlansManager
        initialPlans={plans}
        classes={classes}
        subjects={subjects}
        academicYears={academicYears}
        canCreate={canCreate}
        canEdit={canEdit}
      />
    </div>
  );
}
