"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Student } from "@/types/students";

export function StudentSwitcher({
  students,
  activeId,
}: {
  students: Student[];
  activeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (students.length <= 1) return null;

  return (
    <select
      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
      value={activeId}
      onChange={(e) => router.push(`${pathname}?student_id=${e.target.value}`)}
    >
      {students.map((s) => (
        <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
      ))}
    </select>
  );
}
