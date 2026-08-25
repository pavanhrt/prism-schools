import type { LessonPlan } from "@/types/teaching";
import { academicLagStatus, workingDayLag } from "./rules";
import type { CoverageStatus, SubjectDeliveryInsight } from "./types";

/**
 * Academic delivery evidence, deliberately scoped to what `lesson_plans`
 * actually proves. A timetable slot is never treated as a completed class,
 * and a missing lesson plan is never treated as a missed one — both would be
 * an assumption the source data cannot support. The only objective signal
 * available is `lesson_plans.status`, which is class+subject level (no
 * section), so "scheduled/evidenced" sessions here mean planned curriculum
 * units for that class+subject, shared across every section/teacher row
 * that teaches it — not literal class periods taught.
 */

export interface AcademicDeliveryRow {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
}

export function summarizeAcademicDelivery(params: {
  rows: AcademicDeliveryRow[];
  lessonPlans: LessonPlan[];
  asOfDate: string;
  workingDays: string[];
  slightlyBehindDays: number;
  warningDays: number;
  criticalDays: number;
}): SubjectDeliveryInsight[] {
  const { rows, lessonPlans, asOfDate, workingDays, slightlyBehindDays, warningDays, criticalDays } = params;

  const plansByClassSubject = new Map<string, LessonPlan[]>();
  for (const plan of lessonPlans) {
    const key = `${plan.class_id}:${plan.subject_id}`;
    plansByClassSubject.set(key, [...(plansByClassSubject.get(key) ?? []), plan]);
  }

  return rows.map((row) => {
    const plans = plansByClassSubject.get(`${row.classId}:${row.subjectId}`) ?? [];
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
      classId: row.classId,
      className: row.className,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
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
