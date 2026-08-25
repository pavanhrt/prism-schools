"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import * as repo from "./repository";
import * as service from "./service";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function failure(error: unknown, fallback: string): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : fallback };
}

const settingSchema = z.object({
  settingKey: z.enum([
    "student_absence_warning_days",
    "student_absence_critical_days",
    "student_low_attendance_warning_pct",
    "student_low_attendance_critical_pct",
    "student_attendance_decline_points",
    "staff_absence_warning_days",
    "academic_lag_slightly_behind_days",
    "academic_lag_warning_days",
    "academic_lag_critical_days",
    "performance_change_points",
    "performance_strong_change_points",
    "performance_attention_score_pct",
    "fee_overdue_warning_days",
    "fee_overdue_critical_days",
    "fee_significant_overdue_amount",
    "fee_collection_rate_warning_pct",
    "health_weight_student_attendance",
    "health_weight_academic_progress",
    "health_weight_performance",
    "health_weight_staff_attendance",
    "health_weight_delivery",
    "health_weight_fees",
  ]),
  numericValue: z.coerce.number().finite().min(0).max(100_000),
});

export async function updateSettingAction(input: z.input<typeof settingSchema>): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_settings");
    const parsed = settingSchema.parse(input);
    const supabase = await createClient();
    await service.updateNumericSetting(supabase, parsed.settingKey, parsed.numericValue);
    revalidatePath("/admin/management-intelligence", "layout");
    return { ok: true, message: "Threshold updated." };
  } catch (error) {
    return failure(error, "Could not update the threshold.");
  }
}

export async function refreshAttendanceAlertsAction(): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_alerts");
    const supabase = await createClient();
    const result = await service.refreshAttendanceAlerts(supabase);
    revalidatePath("/admin/management-intelligence", "layout");
    return {
      ok: true,
      message: `Refresh complete: ${result.created} created, ${result.updated} updated, ${result.reopened} reopened, ${result.resolved} resolved.`,
    };
  } catch (error) {
    return failure(error, "Could not refresh attendance alerts.");
  }
}

export async function refreshAllAlertsAction(): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_alerts");
    const supabase = await createClient();
    const result = await service.refreshAllAlerts(supabase);
    revalidatePath("/admin/management-intelligence", "layout");
    return {
      ok: true,
      message: `Refresh complete across attendance, academics, performance, and fees: ${result.created} created, ${result.updated} updated, ${result.reopened} reopened, ${result.resolved} resolved.`,
    };
  } catch (error) {
    return failure(error, "Could not refresh management alerts.");
  }
}

const alertTransitionSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(["ACKNOWLEDGED", "RESOLVED", "DISMISSED"]),
  note: z.string().trim().max(500).optional(),
});

const calendarOverrideSchema = z.object({
  academicYearId: z.string().uuid(),
  calendarDate: z.string().date(),
  isWorkingDay: z.boolean(),
  label: z.string().trim().min(2).max(120),
});

const weeklyOffDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  enabled: z.boolean(),
});

export async function setWeeklyOffDayAction(input: z.input<typeof weeklyOffDaySchema>): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_settings");
    const parsed = weeklyOffDaySchema.parse(input);
    const supabase = await createClient();
    await repo.setWeeklyOffDay(supabase, parsed.dayOfWeek, parsed.enabled);
    revalidatePath("/admin/management-intelligence", "layout");
    return { ok: true, message: "Weekly off-day updated." };
  } catch (error) {
    return failure(error, "Could not update the weekly off-day.");
  }
}

export async function upsertCalendarOverrideAction(input: z.input<typeof calendarOverrideSchema>): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_settings");
    const parsed = calendarOverrideSchema.parse(input);
    const supabase = await createClient();
    await repo.upsertCalendarOverride(supabase, {
      academic_year_id: parsed.academicYearId,
      calendar_date: parsed.calendarDate,
      is_working_day: parsed.isWorkingDay,
      label: parsed.label,
    });
    revalidatePath("/admin/management-intelligence", "layout");
    return { ok: true, message: "Calendar override saved." };
  } catch (error) {
    return failure(error, "Could not save the calendar override.");
  }
}

export async function transitionAlertAction(input: z.input<typeof alertTransitionSchema>): Promise<ActionResult> {
  try {
    await requirePermission("management_intelligence.manage_alerts");
    const parsed = alertTransitionSchema.parse(input);
    const supabase = await createClient();
    const alert = await repo.getAlert(supabase, parsed.alertId);
    if (!alert) return { ok: false, error: "Alert not found." };
    await service.transitionAlert(supabase, alert, parsed.status, parsed.note);
    revalidatePath("/admin/management-intelligence", "layout");
    return { ok: true, message: `Alert ${parsed.status.toLowerCase()}.` };
  } catch (error) {
    return failure(error, "Could not update the alert.");
  }
}
