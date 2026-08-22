import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/portal/dashboard", label: "Home" },
  { href: "/portal/attendance", label: "Attendance" },
  { href: "/portal/exams", label: "Exams" },
  { href: "/portal/fees", label: "Fees" },
  { href: "/portal/homework", label: "Homework" },
  { href: "/portal/notices", label: "Notices" },
];

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <p className="text-base font-semibold text-slate-900">School OS</p>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
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
