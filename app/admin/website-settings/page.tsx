import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { getWebsiteAdminConfig } from "@/features/settings/service";
import { WebsiteManagementOverview } from "@/features/settings/components/website-management-overview";

export default async function WebsiteSettingsPage() {
  const canRead = await hasPermission("website_settings.read");

  if (!canRead) redirect("/admin/dashboard");

  const config = await getWebsiteAdminConfig(await createClient());

  return (
    <WebsiteManagementOverview config={config} />
  );
}
