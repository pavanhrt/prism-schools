import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { WebsiteManagementHeader } from "@/features/settings/components/website-management-nav";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!(await hasPermission("website_settings.read"))) redirect("/admin/dashboard");
  return <div className="min-w-0 space-y-6"><WebsiteManagementHeader />{children}</div>;
}
