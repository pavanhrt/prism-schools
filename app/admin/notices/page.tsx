import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listNotices } from "@/features/communication/service";
import { NoticesManager } from "@/features/communication/components/notices-manager";

export default async function NoticesPage() {
  const supabase = await createClient();
  const [notices, canCreate] = await Promise.all([
    listNotices(supabase),
    hasPermission("communication.create"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notice Board</h1>
      </div>
      <NoticesManager initialNotices={notices} canCreate={canCreate} />
    </div>
  );
}
