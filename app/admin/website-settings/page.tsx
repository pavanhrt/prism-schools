import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { getWebsiteAdminConfig } from "@/features/settings/service";
import { WebsiteSettingsManager } from "@/features/settings/components/website-settings-manager";

export default async function WebsiteSettingsPage() {
  const [canRead, canManage] = await Promise.all([
    hasPermission("website_settings.read"),
    hasPermission("website_settings.manage"),
  ]);

  if (!canRead) redirect("/admin/dashboard");

  const config = await getWebsiteAdminConfig(await createClient());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Public website CMS</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">School Website Settings</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Update PRISM branding and public marketing content without a code deployment. Public academic programs remain separate from operational classes and enrollments.
        </p>
      </div>
      <WebsiteSettingsManager config={config} canManage={canManage} />
    </div>
  );
}
