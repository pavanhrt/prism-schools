"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import * as service from "./service";
import { bookSchema, issueBookSchema, type BookInput, type IssueBookInput } from "@/validations/library";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createBookAction(input: BookInput): Promise<ActionResult> {
  try {
    await requirePermission("library.manage");
    const parsed = bookSchema.parse(input);
    const supabase = await createClient();
    await service.createBook(supabase, parsed);
    revalidatePath("/admin/library");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not add book.");
  }
}

export async function issueBookAction(input: IssueBookInput): Promise<ActionResult> {
  try {
    await requirePermission("library.issue");
    const parsed = issueBookSchema.parse(input);
    const supabase = await createClient();
    await service.issueBook(supabase, parsed);
    revalidatePath("/admin/library");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not issue book.");
  }
}

export async function returnBookAction(issueId: string): Promise<ActionResult> {
  try {
    await requirePermission("library.issue");
    const supabase = await createClient();
    await service.returnBook(supabase, issueId);
    revalidatePath("/admin/library");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not return book.");
  }
}
