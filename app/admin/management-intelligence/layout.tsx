import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { ManagementNav } from "@/features/management-intelligence/components/management-nav";

export default async function ManagementIntelligenceLayout({ children }: { children: ReactNode }) {
  if (!(await hasPermission("management_intelligence.view"))) redirect("/admin/dashboard");
  return <div className="flex flex-col gap-6"><ManagementNav />{children}</div>;
}
