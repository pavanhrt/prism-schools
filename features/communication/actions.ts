"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, getCurrentUser } from "@/lib/permissions";
import * as service from "./service";
import {
  emailTemplateSchema,
  noticeSchema,
  sendEmailSchema,
  smsTemplateSchema,
  type EmailTemplateInput,
  type NoticeInput,
  type SendEmailInput,
  type SmsTemplateInput,
} from "@/validations/communication";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toResult(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function createNoticeAction(input: NoticeInput): Promise<ActionResult> {
  try {
    await requirePermission("communication.create");
    const parsed = noticeSchema.parse(input);
    const supabase = await createClient();
    await service.createNotice(supabase, parsed);
    revalidatePath("/admin/notices");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create notice.");
  }
}

export async function createEmailTemplateAction(
  input: EmailTemplateInput,
): Promise<ActionResult> {
  try {
    await requirePermission("communication.manage_templates");
    const parsed = emailTemplateSchema.parse(input);
    const supabase = await createClient();
    await service.createEmailTemplate(supabase, parsed);
    revalidatePath("/admin/communication/templates");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create email template.");
  }
}

export async function createSmsTemplateAction(input: SmsTemplateInput): Promise<ActionResult> {
  try {
    await requirePermission("communication.manage_templates");
    const parsed = smsTemplateSchema.parse(input);
    const supabase = await createClient();
    await service.createSmsTemplate(supabase, parsed);
    revalidatePath("/admin/communication/templates");
    return { ok: true };
  } catch (err) {
    return toResult(err, "Could not create SMS template.");
  }
}

export async function sendEmailAction(input: SendEmailInput): Promise<ActionResult> {
  try {
    await requirePermission("communication.create");
    const parsed = sendEmailSchema.parse(input);
    const supabase = await createClient();
    const user = await getCurrentUser();

    let variables: Record<string, string> = {};
    if (parsed.variables_json) {
      try {
        variables = JSON.parse(parsed.variables_json);
      } catch {
        return { ok: false, error: "Variables must be valid JSON, e.g. {\"student_name\":\"Asha\"}" };
      }
    }

    const result = await service.sendTemplatedEmail(supabase, {
      templateId: parsed.template_id,
      recipientEmail: parsed.recipient_email,
      recipientGroup: parsed.recipient_group || null,
      variables,
      senderId: user?.id ?? null,
    });

    revalidatePath("/admin/communication/logs");
    return result.sent ? { ok: true } : { ok: false, error: result.error ?? "Send failed." };
  } catch (err) {
    return toResult(err, "Could not send email.");
  }
}
