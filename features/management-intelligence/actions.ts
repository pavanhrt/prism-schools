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
  ]),
  numericValue: z.coerce.number().finite().min(0).max(1000),
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
