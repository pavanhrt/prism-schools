import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listApplications } from "@/features/admissions/service";
import { listClasses, listSections } from "@/features/academics/repository";
import { ApplicationsManager } from "@/features/admissions/components/applications-manager";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const [applications, classes, sections, canEdit, canAdmit] = await Promise.all([
    listApplications(supabase),
    listClasses(supabase),
    listSections(supabase),
    hasPermission("admissions.edit"),
    hasPermission("admissions.admit"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admissions — Applications</h1>
        <p className="text-sm text-slate-500">
          Stage 3: review a submitted application, then admit it — the one action that
          creates a permanent student record.
        </p>
      </div>
      <ApplicationsManager
        initialApplications={applications}
        classes={classes}
        sections={sections}
        canEdit={canEdit}
        canAdmit={canAdmit}
      />
    </div>
  );
}
