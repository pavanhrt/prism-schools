import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAcademicYears, listClasses, listSections } from "@/features/academics/repository";
import { listRoster } from "@/features/students/service";
import { listAttendanceForDate } from "@/features/attendance/service";
import { AttendanceSelector } from "@/features/attendance/components/attendance-selector";
import { AttendanceSheet } from "@/features/attendance/components/attendance-sheet";
import type { AttendanceStatus } from "@/types/attendance";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; section_id?: string; date?: string }>;
}) {
  const { class_id, section_id, date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const [classes, sections, academicYears, canMarkAtAll] = await Promise.all([
    listClasses(supabase),
    listSections(supabase),
    listAcademicYears(supabase),
    hasPermission("attendance.mark"),
  ]);

  const currentYear = academicYears.find((y) => y.is_current);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">
          Only the class (homeroom) teacher for a section — or an admin — can mark it.
        </p>
      </div>

      <AttendanceSelector
        classes={classes}
        sections={sections}
        defaultClassId={class_id}
        defaultSectionId={section_id}
        defaultDate={date ?? today}
      />

      {!currentYear && (
        <p className="text-sm text-amber-600">
          No academic year is marked current — set one from Academic Years before taking
          attendance.
        </p>
      )}

      {class_id && section_id && date && currentYear && (
        <AttendanceContent
          classId={class_id}
          sectionId={section_id}
          date={date}
          academicYearId={currentYear.id}
          className={classes.find((c) => c.id === class_id)?.name ?? "Class"}
          sectionName={sections.find((s) => s.id === section_id)?.name ?? "Section"}
          canMarkAtAll={canMarkAtAll}
        />
      )}
    </div>
  );
}

async function AttendanceContent({
  classId,
  sectionId,
  date,
  academicYearId,
  className,
  sectionName,
  canMarkAtAll,
}: {
  classId: string;
  sectionId: string;
  date: string;
  academicYearId: string;
  className: string;
  sectionName: string;
  canMarkAtAll: boolean;
}) {
  const supabase = await createClient();

  const [roster, existingRecords, { data: isAdmin }, { data: isClassTeacher }] = await Promise.all([
    listRoster(supabase, classId, sectionId),
    listAttendanceForDate(supabase, classId, sectionId, date),
    supabase.rpc("is_admin"),
    supabase.rpc("is_class_teacher", {
      p_class_id: classId,
      p_section_id: sectionId,
      p_academic_year_id: academicYearId,
    }),
  ]);

  const existing: Record<string, AttendanceStatus> = {};
  for (const r of existingRecords) existing[r.student_id] = r.status;

  const canMark = canMarkAtAll && Boolean(isAdmin || isClassTeacher);

  return (
    <AttendanceSheet
      roster={roster}
      existing={existing}
      academicYearId={academicYearId}
      classId={classId}
      sectionId={sectionId}
      date={date}
      className={className}
      sectionName={sectionName}
      canMark={canMark}
    />
  );
}
