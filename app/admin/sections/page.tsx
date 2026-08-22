import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listClasses, listSections } from "@/features/academics/repository";
import { SectionsManager } from "@/features/academics/components/sections-manager";

export default async function SectionsPage() {
  const supabase = await createClient();
  const [sections, classes, canCreate, canDelete] = await Promise.all([
    listSections(supabase),
    listClasses(supabase),
    hasPermission("academics.create"),
    hasPermission("academics.delete"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Sections</h1>
        <p className="text-sm text-slate-500">Sections belong to a class and hold a seat capacity.</p>
      </div>
      <SectionsManager
        initialSections={sections}
        classes={classes}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
