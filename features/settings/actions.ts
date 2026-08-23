"use server";

import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { refreshPublicWebsite } from "@/features/public/revalidation";
import { z } from "zod";
import { schoolSettingsUpdateSchema, websiteFeatureSchema, websiteProgramSchema, websiteRecordIdSchema, websiteReorderSchema, websiteServiceSchema, type SchoolSettingsUpdateInput, type WebsiteFeatureInput, type WebsiteProgramInput, type WebsiteServiceInput } from "@/validations/settings";
import * as service from "./service";

export type ActionResult = { ok: true } | { ok: false; error: string };
const failure = (error: unknown, fallback: string): ActionResult => {
  console.error("Website settings action failed", error);
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? fallback };
  return { ok: false, error: fallback };
};

async function mutate(parseAndRun: () => Promise<unknown>, fallback: string): Promise<ActionResult> {
  try { await parseAndRun(); refreshPublicWebsite(); return { ok: true }; } catch (error) { return failure(error, fallback); }
}

export async function updateSchoolSettingsAction(input: SchoolSettingsUpdateInput): Promise<ActionResult> {
  return mutate(async () => { await requirePermission("website_settings.manage"); const parsed = schoolSettingsUpdateSchema.parse(input); const s = await createClient(); await service.updateSchoolSettings(s, parsed); }, "Could not update website settings.");
}
export async function createWebsiteProgramAction(input: WebsiteProgramInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsed = websiteProgramSchema.parse(input); await service.createWebsiteProgram(await createClient(), parsed); }, "Could not create program."); }
export async function updateWebsiteProgramAction(id: string, input: WebsiteProgramInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); const parsed = websiteProgramSchema.parse(input); await service.updateWebsiteProgram(await createClient(), parsedId, parsed); }, "Could not update program."); }
export async function deleteWebsiteProgramAction(id: string): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); await service.deleteWebsiteProgram(await createClient(), parsedId); }, "Could not delete program."); }
export async function createWebsiteServiceAction(input: WebsiteServiceInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsed = websiteServiceSchema.parse(input); await service.createWebsiteService(await createClient(), parsed); }, "Could not create service."); }
export async function updateWebsiteServiceAction(id: string, input: WebsiteServiceInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); const parsed = websiteServiceSchema.parse(input); await service.updateWebsiteService(await createClient(), parsedId, parsed); }, "Could not update service."); }
export async function deleteWebsiteServiceAction(id: string): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); await service.deleteWebsiteService(await createClient(), parsedId); }, "Could not delete service."); }
export async function createWebsiteFeatureAction(input: WebsiteFeatureInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsed = websiteFeatureSchema.parse(input); await service.createWebsiteFeature(await createClient(), parsed); }, "Could not create feature."); }
export async function updateWebsiteFeatureAction(id: string, input: WebsiteFeatureInput): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); const parsed = websiteFeatureSchema.parse(input); await service.updateWebsiteFeature(await createClient(), parsedId, parsed); }, "Could not update feature."); }
export async function deleteWebsiteFeatureAction(id: string): Promise<ActionResult> { return mutate(async () => { await requirePermission("website_settings.manage"); const parsedId = websiteRecordIdSchema.parse(id); await service.deleteWebsiteFeature(await createClient(), parsedId); }, "Could not delete feature."); }
export async function reorderWebsiteCollectionAction(input: unknown): Promise<ActionResult> {
  return mutate(async () => {
    await requirePermission("website_settings.manage");
    const parsed = websiteReorderSchema.parse(input);
    await service.reorderWebsiteCollection(await createClient(), parsed.collection, parsed.id, parsed.direction);
  }, "Could not reorder website content.");
}
