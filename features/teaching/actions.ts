"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  homeworkSchema,
  lessonPlanSchema,
  teacherAssignmentSchema,
  timetableSchema,
  type HomeworkInput,
  type LessonPlanInput,
  type TeacherAssignmentInput,
  type TimetableInput,
} from "@/validations/teaching";
import type { LessonPlan } from "@/types/teaching";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createTeacherAssignmentAction(
  input: TeacherAssignmentInput,
): Promise<ActionResult> {
  try {
    await requirePermission("teachers.assign");
    const parsed = teacherAssignmentSchema.parse(input);
    const supabase = await createClient();
    await service.createTeacherAssignment(supabase, parsed);
    revalidatePath("/admin/teacher-assignments");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create teacher assignment.");
  }
}

export async function deleteTeacherAssignmentAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("teachers.assign");
    const supabase = await createClient();
    await service.deleteTeacherAssignment(supabase, id);
    revalidatePath("/admin/teacher-assignments");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not remove teacher assignment.");
  }
}

export async function createTimetableEntryAction(
  input: TimetableInput,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.create");
    const parsed = timetableSchema.parse(input);
    const supabase = await createClient();
    await service.createTimetableEntry(supabase, parsed);
    revalidatePath("/admin/timetable");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create timetable entry.");
  }
}

export async function deleteTimetableEntryAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("academics.delete");
    const supabase = await createClient();
    await service.deleteTimetableEntry(supabase, id);
    revalidatePath("/admin/timetable");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete timetable entry.");
  }
}

export async function createLessonPlanAction(input: LessonPlanInput): Promise<ActionResult> {
  try {
    await requirePermission("lesson_plans.create");
    const parsed = lessonPlanSchema.parse(input);
    const supabase = await createClient();
    await service.createLessonPlan(supabase, parsed);
    revalidatePath("/admin/lesson-plans");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create lesson plan.");
  }
}

export async function updateLessonPlanStatusAction(
  id: string,
  status: LessonPlan["status"],
): Promise<ActionResult> {
  try {
    await requirePermission("lesson_plans.edit");
    const supabase = await createClient();
    await service.updateLessonPlanStatus(supabase, id, status);
    revalidatePath("/admin/lesson-plans");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not update lesson plan.");
  }
}

export async function createHomeworkAction(input: HomeworkInput): Promise<ActionResult> {
  try {
    await requirePermission("homework.create");
    const parsed = homeworkSchema.parse(input);
    const supabase = await createClient();
    await service.createHomework(supabase, parsed);
    revalidatePath("/admin/homework");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create homework.");
  }
}
