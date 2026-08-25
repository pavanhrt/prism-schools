import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/permissions";
import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

const NAV: { href: string; label: string; permission: string | null }[] = [
  { href: "/admin/dashboard", label: "Dashboard", permission: null },
  { href: "/admin/management-intelligence", label: "Management Intelligence", permission: "management_intelligence.view" },
  { href: "/admin/admissions/inquiries", label: "Inquiries", permission: "admissions.view" },
  { href: "/admin/admissions/applications", label: "Applications", permission: "admissions.view" },
  { href: "/admin/students", label: "Students", permission: "students.view" },
  { href: "/admin/academic-years", label: "Academic Years", permission: "academics.view" },
  { href: "/admin/classes", label: "Classes", permission: "academics.view" },
  { href: "/admin/sections", label: "Sections", permission: "academics.view" },
  { href: "/admin/subjects", label: "Subjects", permission: "academics.view" },
  { href: "/admin/teacher-assignments", label: "Teacher Assignments", permission: "academics.view" },
  { href: "/admin/timetable", label: "Timetable", permission: "academics.view" },
  { href: "/admin/lesson-plans", label: "Lesson Plans", permission: "lesson_plans.view" },
  { href: "/admin/homework", label: "Homework", permission: "homework.view" },
  { href: "/admin/attendance", label: "Attendance", permission: "attendance.view" },
  { href: "/admin/student-leave-requests", label: "Student Leave Requests", permission: "attendance.edit" },
  { href: "/admin/exams/terms", label: "Exam Terms", permission: "exams.view" },
  { href: "/admin/exams", label: "Exams", permission: "exams.view" },
  { href: "/admin/exams/grades", label: "Grade Scale", permission: "exams.view" },
  { href: "/admin/fees/types", label: "Fee Types", permission: "fees.view" },
  { href: "/admin/fees/structures", label: "Fee Structures", permission: "fees.view" },
  { href: "/admin/fees/invoices", label: "Invoices", permission: "fees.view" },
  { href: "/admin/expenses", label: "Expenses", permission: "expenses.view" },
  { href: "/admin/finance", label: "Finance", permission: "fees.view" },
  { href: "/admin/staff", label: "Staff", permission: "staff.view" },
  { href: "/admin/leave", label: "Leave", permission: "leave.view" },
  { href: "/admin/staff-attendance", label: "Staff Attendance", permission: "staff_attendance.view" },
  { href: "/admin/payroll", label: "Payroll", permission: "payroll.view" },
  { href: "/admin/notices", label: "Notices", permission: null },
  { href: "/admin/communication/templates", label: "Templates", permission: "communication.manage_templates" },
  { href: "/admin/communication/logs", label: "Send Email", permission: "communication.create" },
  { href: "/admin/library", label: "Library", permission: "library.view" },
  { href: "/admin/hostel", label: "Hostel", permission: "hostel.view" },
  { href: "/admin/transport", label: "Transport", permission: "transport.view" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory.view" },
  {
    href: "/admin/website-settings",
    label: "Website Management",
    permission: "website_settings.read",
  },
  { href: "/admin/settings/roles", label: "Roles & Users", permission: "roles.view" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const visibleNav: typeof NAV = [];
  for (const item of NAV) {
    if (!item.permission || (await hasPermission(item.permission))) {
      visibleNav.push(item);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="flex max-h-64 w-full flex-col overflow-y-auto border-b border-slate-200 bg-white p-4 lg:max-h-none lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <p className="mb-6 px-2 text-lg font-semibold text-slate-900">School OS</p>
        <nav className="flex flex-1 flex-col gap-1">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="px-2 pt-4">
          <Button variant="outline" size="sm" className="w-full" type="submit">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
