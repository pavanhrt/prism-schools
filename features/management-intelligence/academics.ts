import type { LessonPlan } from "@/types/teaching";
import { academicLagStatus, workingDayLag } from "./rules";
import type { CoverageStatus, SubjectDeliveryInsight } from "./types";

/**
 * Academic delivery evidence, deliberately scoped to what `lesson_plans`
 * actually proves. A timetable slot is never treated as a completed class,
 * and a missing lesson plan is never treated as a missed one — both would be
 * an assumption the source data cannot support. The only objective signal
 * available is `lesson_plans.status`, which is class+subject level (no
 * section, no teacher) — so there is exactly ONE authoritative intelligence
 * unit per (academic_year_id, class_id, subject_id), never one per
 * section/teacher assignment. Producing a separate row per assignment would
 * silently repeat the same evidence multiple times and imply it was
 * measured independently for each section/teacher, which it was not.
 * Assigned sections/teachers are attached as context only.
 */

export interface AcademicAssignmentRow {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  teacherId: string | null;
  teacherName: string | null;
}

export function summarizeAcademicDelivery(params: {
  assignments: AcademicAssignmentRow[];
  lessonPlans: LessonPlan[];
  asOfDate: string;
  workingDays: string[];
  slightlyBehindDays: number;
  warningDays: number;
  criticalDays: number;
}): SubjectDeliveryInsight[] {
  const { assignments, lessonPlans, asOfDate, workingDays, slightlyBehindDays, warningDays, criticalDays } = params;

  const plansByClassSubject = new Map<string, LessonPlan[]>();
  for (const plan of lessonPlans) {
    const key = `${plan.class_id}:${plan.subject_id}`;
    plansByClassSubject.set(key, [...(plansByClassSubject.get(key) ?? []), plan]);
  }

  // One unit per class+subject — deduplicate every assignment row into it,
  // collecting sections/teachers as context rather than duplicating rows.
  interface Unit {
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    sections: Map<string, string>;
    teachers: Map<string, string | null>;
  }
  const units = new Map<string, Unit>();
  for (const row of assignments) {
    const key = `${row.classId}:${row.subjectId}`;
    const unit = units.get(key) ?? {
      classId: row.classId,
      className: row.className,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      sections: new Map<string, string>(),
      teachers: new Map<string, string | null>(),
    };
    unit.sections.set(row.sectionId, row.sectionName);
    if (row.teacherId) unit.teachers.set(row.teacherId, row.teacherName);
    units.set(key, unit);
  }

  return [...units.values()].map((unit) => {
    const plans = plansByClassSubject.get(`${unit.classId}:${unit.subjectId}`) ?? [];
    const duePlans = plans.filter((plan) => plan.planned_date <= asOfDate);
    const pendingDue = duePlans.filter((plan) => plan.status !== "completed");
    const expectedProgress = duePlans.length;
    const actualProgress = expectedProgress - pendingDue.length;

    // Lag is only ever computed from an actual overdue, incomplete plan. No
    // due plan at all means there is nothing objective to lag behind.
    let lagDays: number | null = null;
    if (duePlans.length > 0) {
      if (pendingDue.length === 0) {
        lagDays = 0;
      } else {
        const oldestPending = pendingDue.reduce((oldest, plan) => (plan.planned_date < oldest.planned_date ? plan : oldest));
        lagDays = workingDayLag(oldestPending.planned_date, asOfDate, workingDays);
      }
    }

    const status = academicLagStatus(lagDays, slightlyBehindDays, warningDays, criticalDays);
    const dataCoverage: CoverageStatus = plans.length === 0 ? "NOT_RECORDED" : expectedProgress === 0 ? "PARTIAL" : "COMPLETE";
    const evidenceCoveragePercentage = expectedProgress > 0 ? Math.round((actualProgress / expectedProgress) * 10_000) / 100 : null;

    return {
      classId: unit.classId,
      className: unit.className,
      subjectId: unit.subjectId,
      subjectName: unit.subjectName,
      assignedSections: [...unit.sections.entries()]
        .map(([sectionId, sectionName]) => ({ sectionId, sectionName }))
        .sort((a, b) => a.sectionName.localeCompare(b.sectionName)),
      assignedTeachers: [...unit.teachers.entries()]
        .map(([teacherId, teacherName]) => ({ teacherId, teacherName }))
        .sort((a, b) => (a.teacherName ?? "").localeCompare(b.teacherName ?? "")),
      progressEvidenceLevel: "CLASS_SUBJECT" as const,
      scheduledSessions: expectedProgress,
      evidencedSessions: actualProgress,
      notRecordedSessions: pendingDue.length,
      evidenceCoveragePercentage,
      expectedProgress,
      actualProgress,
      pendingTopics: pendingDue.length,
      lagDays,
      status,
      dataCoverage,
    };
  });
}
