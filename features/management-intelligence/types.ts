import type { AttendanceStatus } from "@/types/attendance";
import type { StaffAttendanceStatus } from "@/types/staff";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
export type AlertCategory =
  | "ATTENDANCE"
  | "STAFF"
  | "ACADEMICS"
  | "TIMETABLE"
  | "PERFORMANCE"
  | "FEES"
  | "OPERATIONS";

export interface IntelligenceSetting {
  setting_key: string;
  value_type: "numeric" | "string" | "boolean";
  numeric_value: number | null;
  string_value: string | null;
  boolean_value: boolean | null;
  description: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}
export interface CalendarOverride {
  id: string;
  academic_year_id: string;
  calendar_date: string;
  is_working_day: boolean;
  label: string;
}

export interface ManagementAlert {
  id: string;
  fingerprint: string;
  rule_key: string;
  alert_type: string;
  category: AlertCategory;
  severity: AlertSeverity;
  entity_type: string;
  entity_id: string | null;
  student_id: string | null;
  staff_id: string | null;
  class_id: string | null;
  section_id: string | null;
  subject_id: string | null;
  academic_year_id: string | null;
  period_start: string | null;
  period_end: string | null;
  title: string;
  message: string;
  current_value: number | null;
  threshold_value: number | null;
  status: AlertStatus;
  first_detected_at: string;
  last_detected_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceInput {
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
}

export interface StaffAttendanceInput {
  staff_id: string;
  attendance_date: string;
  status: StaffAttendanceStatus;
}

export interface AttendanceMetric {
  recordedDays: number;
  presentEquivalent: number;
  percentage: number | null;
}

export type TrendStatus = "DECLINING" | "IMPROVING" | "STABLE" | "INSUFFICIENT_DATA";

export interface StudentInsight {
  studentId: string;
  admissionNo: string;
  studentName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  presentDays: number;
  recordedWorkingDays: number;
  attendancePercentage: number | null;
  previousPercentage: number | null;
  differencePoints: number | null;
  consecutiveAbsenceDays: number;
  latestRecordedAttendanceEvaluation: "ABSENT" | "NON_ABSENT" | "NOT_EVALUATED";
  trend: TrendStatus;
  severity: AlertSeverity | null;
}

export interface StaffInsight {
  staffId: string;
  staffNo: string;
  staffName: string;
  presentDays: number;
  recordedWorkingDays: number;
  attendancePercentage: number | null;
  consecutiveAbsenceDays: number;
  latestRecordedAttendanceEvaluation: "ABSENT" | "NON_ABSENT" | "NOT_EVALUATED";
  severity: AlertSeverity | null;
}

export interface OverviewMetric {
  value: number | null;
  dataAvailable: boolean;
}

// -----------------------------------------------------------------------------
// Phase 2
// -----------------------------------------------------------------------------
export type CoverageStatus = "COMPLETE" | "PARTIAL" | "INCOMPLETE" | "NOT_RECORDED";

export interface CoverageMetric {
  activeCount: number;
  recordedCount: number;
  missingCount: number;
  coveragePercentage: number | null;
  status: CoverageStatus;
}

export type DeliveryStatus = "ON_TRACK" | "SLIGHTLY_BEHIND" | "WARNING" | "CRITICAL" | "INSUFFICIENT_DATA";

export interface SubjectDeliveryInsight {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  scheduledSessions: number;
  evidencedSessions: number;
  notRecordedSessions: number;
  evidenceCoveragePercentage: number | null;
  expectedProgress: number;
  actualProgress: number;
  pendingTopics: number;
  lagDays: number | null;
  status: DeliveryStatus;
  dataCoverage: CoverageStatus;
}

export type PerformanceTrendStatus =
  | "STRONGLY_IMPROVING"
  | "IMPROVING"
  | "STABLE"
  | "DECLINING"
  | "STRONGLY_DECLINING"
  | "INSUFFICIENT_DATA";

export interface PerformanceTrendResult {
  differencePoints: number | null;
  status: PerformanceTrendStatus;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  percentage: number | null;
  isPass: boolean | null;
  trend: PerformanceTrendResult;
}

export interface StudentPerformanceInsight {
  studentId: string;
  admissionNo: string;
  studentName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  latestExamId: string | null;
  latestExamName: string | null;
  latestPercentage: number | null;
  previousPercentage: number | null;
  differencePoints: number | null;
  trend: PerformanceTrendStatus;
  subjects: SubjectPerformance[];
  failedSubjects: string[];
  subjectsRequiringAttention: { subjectName: string; reason: string }[];
  classRank: number | null;
  dataCoverage: CoverageStatus;
  requiresAttention: boolean;
  attentionReasons: string[];
}

export interface ClassPerformanceSummary {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  studentsAssessed: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  median: number | null;
  passPercentage: number | null;
}

export interface HealthComponentInput {
  key: string;
  label: string;
  weight: number;
  score: number | null;
}

export interface HealthComponentResult extends HealthComponentInput {
  available: boolean;
}

export interface HealthScoreResult {
  score: number | null;
  coveragePercentage: number;
  unavailable: string[];
  components: HealthComponentResult[];
}

export interface FeeSummary {
  totalInvoiced: number;
  totalCollected: number;
  outstanding: number;
  collectionPercentage: number | null;
  overdueAmount: number;
  studentsWithOutstanding: number;
  studentsWithOverdue: number;
  invoiceCount: number;
  dataCoverage: CoverageStatus;
}

export interface OverdueStudentRow {
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  sectionName: string;
  invoiceId: string;
  invoiceNo: string;
  dueDate: string;
  overdueDays: number;
  balance: number;
  severity: AlertSeverity;
}

export interface ManagementOverview {
  periodStart: string;
  periodEnd: string;
  academicYearId: string | null;
  academicYearLabel: string | null;
  schoolStatus: {
    openCritical: number;
    openWarnings: number;
    resolvedThisPeriod: number;
  };
  students: {
    active: number;
    presentToday: OverviewMetric;
    absentToday: OverviewMetric;
    attendanceTodayPercentage: OverviewMetric;
    absentWarning: number;
    absentCritical: number;
    belowWarning: number;
    belowCritical: number;
    coverageToday: CoverageMetric;
  };
  staff: {
    active: number;
    presentToday: OverviewMetric;
    absentToday: OverviewMetric;
    attendancePercentage: OverviewMetric;
    absentWarning: number;
    coverageToday: CoverageMetric;
  };
  evaluationMessage: string | null;
}
