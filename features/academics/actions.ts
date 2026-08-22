"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import {
  academicYearSchema,
  classSchema,
  sectionSchema,
  subjectSchema,
  type AcademicYearInput,
  type ClassInput,
  type SectionInput,
  type SubjectInput,
} from "@/validations/academic";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

// ---- Academic Years ----------------------------------------------------

export async function createAcademicYearAction(
  input: AcademicYearInput,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.create");
    const parsed = academicYearSchema.parse(input);
    const supabase = await createClient();
    await service.createAcademicYear(supabase, parsed);
    revalidatePath("/admin/academic-years");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create academic year.");
  }
}

export async function setCurrentAcademicYearAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.edit");
    const supabase = await createClient();
    await service.setCurrentAcademicYear(supabase, id);
    revalidatePath("/admin/academic-years");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not set the current academic year.");
  }
}

export async function deleteAcademicYearAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.delete");
    const supabase = await createClient();
    await service.deleteAcademicYear(supabase, id);
    revalidatePath("/admin/academic-years");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete academic year.");
  }
}

// ---- Classes ---------------------------------------------------------------

export async function createClassAction(input: ClassInput): Promise<ActionResult> {
  try {
    await requirePermission("academics.create");
    const parsed = classSchema.parse(input);
    const supabase = await createClient();
    await service.createClass(supabase, parsed);
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create class.");
  }
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("academics.delete");
    const supabase = await createClient();
    await service.deleteClass(supabase, id);
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete class.");
  }
}

// ---- Sections ----------------------------------------------------------------

export async function createSectionAction(
  input: SectionInput,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.create");
    const parsed = sectionSchema.parse(input);
    const supabase = await createClient();
    await service.createSection(supabase, parsed);
    revalidatePath("/admin/sections");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create section.");
  }
}

export async function deleteSectionAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("academics.delete");
    const supabase = await createClient();
    await service.deleteSection(supabase, id);
    revalidatePath("/admin/sections");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete section.");
  }
}

// ---- Subjects ----------------------------------------------------------------

export async function createSubjectAction(
  input: SubjectInput,
): Promise<ActionResult> {
  try {
    await requirePermission("academics.create");
    const parsed = subjectSchema.parse(input);
    const supabase = await createClient();
    await service.createSubject(supabase, parsed);
    revalidatePath("/admin/subjects");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create subject.");
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("academics.delete");
    const supabase = await createClient();
    await service.deleteSubject(supabase, id);
    revalidatePath("/admin/subjects");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not delete subject.");
  }
}
