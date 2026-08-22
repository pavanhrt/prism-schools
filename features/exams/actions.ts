"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  enterMarksSchema,
  examScheduleSchema,
  examSchema,
  examTermSchema,
  gradeScaleSchema,
  type EnterMarksInput,
  type ExamInput,
  type ExamScheduleInput,
  type ExamTermInput,
  type GradeScaleInput,
} from "@/validations/exams";
import type { ResultStatus } from "@/types/exams";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createExamTermAction(input: ExamTermInput): Promise<ActionResult> {
  try {
    await requirePermission("exams.create");
    const parsed = examTermSchema.parse(input);
    const supabase = await createClient();
    await service.createExamTerm(supabase, parsed);
    revalidatePath("/admin/exams/terms");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create exam term.");
  }
}

export async function createExamAction(input: ExamInput): Promise<ActionResult> {
  try {
    await requirePermission("exams.create");
    const parsed = examSchema.parse(input);
    const supabase = await createClient();
    await service.createExam(supabase, parsed);
    revalidatePath("/admin/exams");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create exam.");
  }
}

export async function createExamScheduleAction(
  input: ExamScheduleInput,
): Promise<ActionResult> {
  try {
    await requirePermission("exams.create");
    const parsed = examScheduleSchema.parse(input);
    const supabase = await createClient();
    await service.createExamSchedule(supabase, parsed);
    revalidatePath("/admin/exams");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create exam schedule.");
  }
}

export async function enterMarksAction(input: EnterMarksInput): Promise<ActionResult> {
  try {
    await requirePermission("exams.enter_marks");
    const parsed = enterMarksSchema.parse(input);
    const supabase = await createClient();
    await service.enterMarks(supabase, parsed);
    revalidatePath("/admin/exams/marks");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not save marks.");
  }
}

export async function submitForReviewAction(examScheduleId: string): Promise<ActionResult> {
  try {
    await requirePermission("exams.enter_marks");
    const supabase = await createClient();
    await service.submitForReview(supabase, examScheduleId);
    revalidatePath("/admin/exams/marks");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not submit for review.");
  }
}

export async function advanceResultStatusAction(
  examScheduleId: string,
  newStatus: ResultStatus,
): Promise<ActionResult> {
  try {
    await requirePermission("exams.publish");
    const supabase = await createClient();
    await service.advanceResultStatus(supabase, examScheduleId, newStatus);
    revalidatePath("/admin/exams/marks");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not update result status.");
  }
}

export async function createGradeScaleAction(input: GradeScaleInput): Promise<ActionResult> {
  try {
    await requirePermission("grades.manage");
    const parsed = gradeScaleSchema.parse(input);
    const supabase = await createClient();
    await service.createGradeScale(supabase, parsed);
    revalidatePath("/admin/exams/grades");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create grade.");
  }
}

export async function deleteGradeScaleAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("grades.manage");
    const supabase = await createClient();
    await service.deleteGradeScale(supabase, id);
    revalidatePath("/admin/exams/grades");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete grade.");
  }
}
