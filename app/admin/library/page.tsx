import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listBooks, listIssues } from "@/features/library/service";
import { LibraryManager } from "@/features/library/components/library-manager";

export default async function LibraryPage() {
  const supabase = await createClient();
  const [books, issues, canManage, canIssue] = await Promise.all([
    listBooks(supabase),
    listIssues(supabase),
    hasPermission("library.manage"),
    hasPermission("library.issue"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Library</h1>
      </div>
      <LibraryManager initialBooks={books} initialIssues={issues} canManage={canManage} canIssue={canIssue} />
    </div>
  );
}
