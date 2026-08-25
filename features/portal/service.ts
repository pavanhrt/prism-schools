import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student } from "@/types/students";
import type { LeaveRequestStatus, ParentNotification, StudentLeaveRequest } from "@/types/portal";
import * as repo from "./repository";
import {
  computeAttendanceAlert,
  computeAttendanceBreakdown,
  consecutivePortalAbsences,
  type AttendanceAlert,
  type AttendanceBreakdown,
} from "./rules";
import { listAttendanceForStudent } from "@/features/attendance/service";
import { listSettings as listIntelligenceSettings } from "@/features/management-intelligence/service";
import { listExamSchedules, listResultsForStudent } from "@/features/exams/service";
import { listInvoices, listAllPayments } from "@/features/fees/service";
import { computeInvoiceBalance } from "@/features/fees/balance";
import { listNotices } from "@/features/communication/repository";
import { listAcademicYears } from "@/features/academics/repository";
import { listEnrollmentsForStudent } from "@/features/students/service";

/**
 * Resolves which student record(s) the signed-in portal user can see —
 * either themselves (a student login) or their linked children (a
 * guardian login). Relies entirely on RLS: these are plain selects on the
 * user-scoped client, not a service-role bypass, so this function can
 * never return more than students_select's ownership policy already
 * allows (0024_portal_access.sql).
 */
export async function getPortalStudents(
  supabase: SupabaseClient,
  userId: string,
): Promise<Student[]> {
  const { data: ownStudent, error: ownError } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownError) throw ownError;
  if (ownStudent) return [ownStudent];

  const { data: guardianRow, error: guardianError } = await supabase
    .from("guardians")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (guardianError) throw guardianError;
  if (!guardianRow) return [];

  const { data: links, error: linksError } = await supabase
    .from("student_guardians")
    .select("student_id")
    .eq("guardian_id", guardianRow.id);
  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .in("id", links.map((l) => l.student_id));
  if (studentsError) throw studentsError;
  return students ?? [];
}

/** Pure — which of the caller's own students the switcher should show,
 * given what's in the URL. Falls back to the first student whenever the
 * requested id is missing or isn't actually one of theirs (e.g. a stale
 * link, or someone trying another family's student_id in the URL). */
export function pickActiveStudent(students: Student[], requestedId?: string): Student | null {
  if (requestedId) {
    const found = students.find((s) => s.id === requestedId);
    if (found) return found;
  }
  return students[0] ?? null;
}

export async function resolveActiveStudent(
  supabase: SupabaseClient,
  userId: string,
  requestedId?: string,
): Promise<{ students: Student[]; active: Student | null }> {
  const students = await getPortalStudents(supabase, userId);
  return { students, active: pickActiveStudent(students, requestedId) };
}

// ---- Attendance summary (reuses Management Intelligence's configured
// thresholds instead of hardcoding a second copy) --------------------------

export interface AttendanceThresholds {
  warningConsecutiveDays: number;
  criticalConsecutiveDays: number;
  warningPercentage: number;
  criticalPercentage: number;
}

export async function getAttendanceThresholds(supabase: SupabaseClient): Promise<AttendanceThresholds> {
  const rows = await listIntelligenceSettings(supabase);
  const values = new Map(rows.map((row) => [row.setting_key, Number(row.numeric_value)]));
  return {
    warningConsecutiveDays: values.get("student_absence_warning_days") ?? 3,
    criticalConsecutiveDays: values.get("student_absence_critical_days") ?? 5,
    warningPercentage: values.get("student_low_attendance_warning_pct") ?? 75,
    criticalPercentage: values.get("student_low_attendance_critical_pct") ?? 65,
  };
}

export interface StudentAttendanceSummary {
  breakdown: AttendanceBreakdown;
  consecutiveAbsences: number;
  isAbsentToday: boolean;
  alert: AttendanceAlert;
}

export async function getStudentAttendanceSummary(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentAttendanceSummary> {
  const [records, thresholds] = await Promise.all([
    listAttendanceForStudent(supabase, studentId),
    getAttendanceThresholds(supabase),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const breakdown = computeAttendanceBreakdown(records);
  const consecutiveAbsences = consecutivePortalAbsences(records);
  const isAbsentToday = records.find((r) => r.attendance_date === today)?.status === "absent";
  const alert = computeAttendanceAlert({ isAbsentToday, consecutiveAbsences, percentage: breakdown.percentage, ...thresholds });
  return { breakdown, consecutiveAbsences, isAbsentToday, alert };
}

// ---- Notifications ---------------------------------------------------
//
// Fingerprint-based upsert, same pattern as management_alerts: a stable
// fingerprint per (user, event) means re-running the refresh is idempotent
// and never resets is_read on an already-seen notification (the upsert
// payload never includes is_read/read_at, so PostgREST's merge-upsert
// leaves those columns untouched on conflict).

const FEE_DUE_SOON_DAYS = 3;
const EXAM_UPCOMING_DAYS = 3;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function refreshPortalNotifications(
  supabase: SupabaseClient,
  userId: string,
  students: Student[],
): Promise<void> {
  if (students.length === 0) return;

  // Respect a guardian's notification opt-out. Student logins have no
  // guardians row at all, so this only ever suppresses generation for a
  // parent who explicitly turned notifications off — never for the
  // student themselves.
  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .select("notification_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (guardianError) throw guardianError;
  if (guardian && !guardian.notification_enabled) return;

  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(EXAM_UPCOMING_DAYS);
  const feeSoonHorizon = addDays(FEE_DUE_SOON_DAYS);
  const thresholds = await getAttendanceThresholds(supabase);

  const [examSchedules, notices, invoices, payments] = await Promise.all([
    listExamSchedules(supabase),
    listNotices(supabase),
    listInvoices(supabase),
    listAllPayments(supabase),
  ]);

  type Candidate = {
    fingerprint: string;
    student_id: string | null;
    category: ParentNotification["category"];
    title: string;
    message: string;
    link: string | null;
  };
  const candidates: Candidate[] = [];

  for (const student of students) {
    const name = `${student.first_name} ${student.last_name}`;

    const attendance = await listAttendanceForStudent(supabase, student.id);
    const breakdown = computeAttendanceBreakdown(attendance);
    const consecutiveAbsences = consecutivePortalAbsences(attendance);
    const isAbsentToday = attendance.find((a) => a.attendance_date === today)?.status === "absent";
    const alert = computeAttendanceAlert({ isAbsentToday, consecutiveAbsences, percentage: breakdown.percentage, ...thresholds });
    if (alert.level) {
      candidates.push({
        fingerprint: `attendance:${student.id}:${today}:${alert.level}`,
        student_id: student.id,
        category: "ATTENDANCE",
        title: `${name} — ${alert.label}`,
        message: alert.label,
        link: `/portal/attendance?student_id=${student.id}`,
      });
    }

    const results = await listResultsForStudent(supabase, student.id);
    for (const result of results) {
      const schedule = examSchedules.find((s) => s.id === result.exam_schedule_id);
      if (schedule && (schedule.result_status === "published" || schedule.result_status === "locked")) {
        candidates.push({
          fingerprint: `result:${result.id}:${schedule.result_status}`,
          student_id: student.id,
          category: "RESULT",
          title: `${name} — Result published`,
          message: `A result for the ${schedule.exam_date} exam has been published.`,
          link: `/portal/results?student_id=${student.id}`,
        });
      }
    }

    const myInvoices = invoices.filter((i) => i.student_id === student.id);
    for (const invoice of myInvoices) {
      const { balance } = computeInvoiceBalance(invoice, payments);
      if (balance <= 0) continue;
      if (invoice.due_date < today) {
        candidates.push({
          fingerprint: `fee:${invoice.id}:overdue`,
          student_id: student.id,
          category: "FEE",
          title: `${name} — Fee overdue`,
          message: `Invoice ${invoice.invoice_no} is overdue. Balance ₹${balance.toFixed(2)}.`,
          link: `/portal/fees?student_id=${student.id}`,
        });
      } else if (invoice.due_date <= feeSoonHorizon) {
        candidates.push({
          fingerprint: `fee:${invoice.id}:due_soon`,
          student_id: student.id,
          category: "FEE",
          title: `${name} — Fee due soon`,
          message: `Invoice ${invoice.invoice_no} is due ${invoice.due_date}. Balance ₹${balance.toFixed(2)}.`,
          link: `/portal/fees?student_id=${student.id}`,
        });
      }
    }

    const enrollments = await listEnrollmentsForStudent(supabase, student.id);
    const currentClassId = enrollments.find((e) => e.is_current)?.class_id;
    if (currentClassId) {
      const upcomingExams = examSchedules.filter(
        (s) => s.class_id === currentClassId && s.exam_date >= today && s.exam_date <= horizon,
      );
      for (const exam of upcomingExams) {
        candidates.push({
          fingerprint: `exam:${exam.id}:upcoming`,
          student_id: student.id,
          category: "EXAM",
          title: `${name} — Upcoming exam`,
          message: `Exam scheduled on ${exam.exam_date} at ${exam.start_time.slice(0, 5)}.`,
          link: `/portal/exams?student_id=${student.id}`,
        });
      }
    }

    const leaveRequests = await repo.listLeaveRequestsForStudent(supabase, student.id);
    for (const lr of leaveRequests) {
      if (lr.status === "submitted") continue;
      candidates.push({
        fingerprint: `leave_request:${lr.id}:${lr.status}`,
        student_id: student.id,
        category: "LEAVE_REQUEST",
        title: `${name} — Leave request ${lr.status}`,
        message: `Your leave request for ${lr.from_date} to ${lr.to_date} was ${lr.status}.`,
        link: `/portal/leave-requests?student_id=${student.id}`,
      });
    }
  }

  const relevantNotices = notices.filter(
    (n) => n.status === "active" && (n.target_role === "all" || n.target_role === "student" || n.target_role === "parent"),
  );
  for (const notice of relevantNotices) {
    candidates.push({
      fingerprint: `announcement:${notice.id}`,
      student_id: null,
      category: "ANNOUNCEMENT",
      title: notice.title,
      message: notice.message,
      link: `/portal/notices`,
    });
  }

  for (const candidate of candidates) {
    await repo.upsertNotification(supabase, { ...candidate, user_id: userId });
  }
}

export const listPortalNotifications = repo.listNotifications;
export const countUnreadPortalNotifications = repo.countUnreadNotifications;
export const markPortalNotificationRead = repo.markNotificationRead;
export const markAllPortalNotificationsRead = repo.markAllNotificationsRead;

// ---- Student leave requests -------------------------------------------

export async function submitLeaveRequest(
  supabase: SupabaseClient,
  input: { student_id: string; requested_by: string; from_date: string; to_date: string; reason: string | null },
): Promise<StudentLeaveRequest> {
  return repo.insertLeaveRequest(supabase, input);
}

export const listMyLeaveRequests = repo.listLeaveRequestsForStudent;

export async function listLeaveRequestsForReview(
  supabase: SupabaseClient,
  status?: LeaveRequestStatus,
): Promise<StudentLeaveRequest[]> {
  return repo.listAllLeaveRequests(supabase, status);
}

export async function reviewLeaveRequest(
  supabase: SupabaseClient,
  id: string,
  reviewedBy: string,
  status: "approved" | "rejected",
  reviewNote: string | null,
): Promise<void> {
  return repo.reviewLeaveRequest(supabase, id, { status, reviewed_by: reviewedBy, review_note: reviewNote });
}

// ---- Calendar (read-only aggregation — no new events table) -----------

export interface PortalCalendarEvent {
  date: string;
  type: "HOLIDAY" | "EXAM" | "ANNOUNCEMENT";
  title: string;
}

export async function getPortalCalendar(
  supabase: SupabaseClient,
  classId: string | undefined,
  monthStart: string,
  monthEnd: string,
): Promise<PortalCalendarEvent[]> {
  const events: PortalCalendarEvent[] = [];

  const years = await listAcademicYears(supabase);
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  if (currentYear) {
    const overrides = await repo.listCalendarOverrides(supabase, currentYear.id, monthStart, monthEnd);
    for (const o of overrides) {
      if (!o.is_working_day) events.push({ date: o.calendar_date, type: "HOLIDAY", title: o.label });
    }
  }

  const [examSchedules, notices] = await Promise.all([listExamSchedules(supabase), listNotices(supabase)]);
  for (const s of examSchedules) {
    if (s.exam_date >= monthStart && s.exam_date <= monthEnd && (!classId || s.class_id === classId)) {
      events.push({ date: s.exam_date, type: "EXAM", title: "Exam" });
    }
  }
  for (const n of notices) {
    if (n.status !== "active") continue;
    const date = n.created_at.slice(0, 10);
    if (date >= monthStart && date <= monthEnd) events.push({ date, type: "ANNOUNCEMENT", title: n.title });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
