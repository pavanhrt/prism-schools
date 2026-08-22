import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listClasses, maxClassSequence } from "@/features/academics/repository";
import { ClassesManager } from "@/features/academics/components/classes-manager";

export default async function ClassesPage() {
  const supabase = await createClient();
  const [classes, maxSeq, canCreate, canDelete] = await Promise.all([
    listClasses(supabase),
    maxClassSequence(supabase),
    hasPermission("academics.create"),
    hasPermission("academics.delete"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Classes</h1>
        <p className="text-sm text-slate-500">
          Sort order determines promotion sequence once Students (Phase 2) is built.
        </p>
      </div>
      <ClassesManager
        initialClasses={classes}
        nextSequence={maxSeq + 1}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
