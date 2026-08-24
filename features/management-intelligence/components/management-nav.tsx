import Link from "next/link";

const ITEMS = [
  ["/admin/management-intelligence", "Overview"],
  ["/admin/management-intelligence/attendance", "Attendance Intelligence"],
  ["/admin/management-intelligence/alerts", "Alert Center"],
  ["/admin/management-intelligence/settings", "Settings"],
] as const;

export function ManagementNav() {
  return (
    <nav aria-label="Management Intelligence" className="flex flex-wrap gap-2">
      {ITEMS.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {label}
        </Link>
      ))}
    </nav>
  );
}
