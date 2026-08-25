import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const LINKS = [
  { href: "/portal/results", label: "Results", description: "Term results and subject progress" },
  { href: "/portal/homework", label: "Homework", description: "Assignments and due dates" },
  { href: "/portal/timetable", label: "Timetable", description: "Weekly class schedule" },
  { href: "/portal/notices", label: "Announcements", description: "School notices" },
  { href: "/portal/calendar", label: "Calendar", description: "Holidays, exams and events" },
  { href: "/portal/documents", label: "Documents", description: "Fee receipts" },
  { href: "/portal/leave-requests", label: "Leave Requests", description: "Request and track leave" },
  { href: "/portal/profile", label: "Student Profile", description: "Profile and contact details" },
];

export default function PortalMorePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-slate-900">More</h1>
      <div className="flex flex-col gap-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:bg-slate-50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{link.label}</p>
                  <p className="text-xs text-slate-500">{link.description}</p>
                </div>
                <span className="text-slate-400">›</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
