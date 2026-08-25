import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getPortalStudents, refreshPortalNotifications, countUnreadPortalNotifications } from "@/features/portal/service";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/portal/dashboard", label: "Home" },
  { href: "/portal/attendance", label: "Attendance" },
  { href: "/portal/exams", label: "Exams" },
  { href: "/portal/fees", label: "Fees" },
  { href: "/portal/more", label: "More" },
];

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const students = await getPortalStudents(supabase, user.id);
  // Best-effort: notifications are a convenience layer, never a gate on
  // rendering the portal — a refresh failure must not block the page.
  let unreadCount = 0;
  try {
    await refreshPortalNotifications(supabase, user.id, students);
    unreadCount = await countUnreadPortalNotifications(supabase, user.id);
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <p className="text-base font-semibold text-slate-900">PRISM Schools</p>
        <div className="flex items-center gap-2">
          <Link href="/portal/notifications" className="relative rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-slate-200 bg-white py-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
