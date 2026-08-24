import Link from "next/link";
import { hasPermission } from "@/lib/permissions";

const ITEMS = [
  ["/admin/management-intelligence", "Overview"],
  ["/admin/management-intelligence/attendance", "Attendance Intelligence"],
  ["/admin/management-intelligence/alerts", "Alert Center"],
  ["/admin/management-intelligence/settings", "Settings"],
] as const;

export async function ManagementNav() {
  const canManageSettings = await hasPermission("management_intelligence.manage_settings");
  return (
    <nav aria-label="Management Intelligence" className="flex flex-wrap gap-2">
      {ITEMS.filter(([href]) => href !== "/admin/management-intelligence/settings" || canManageSettings).map(([href, label]) => (
        <Link key={href} href={href} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {label}
        </Link>
      ))}
    </nav>
  );
}
