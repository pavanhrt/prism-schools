import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import { renderTemplate } from "./render";
import { sendEmail } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailTemplateInput, NoticeInput, SmsTemplateInput } from "@/validations/communication";

export const listNotices = repo.listNotices;
export const listEmailTemplates = repo.listEmailTemplates;
export const listSmsTemplates = repo.listSmsTemplates;
export const listEmailLogs = repo.listEmailLogs;

export async function createNotice(supabase: SupabaseClient, input: NoticeInput) {
  return repo.insertNotice(supabase, {
    title: input.title,
    message: input.message,
    target_role: input.target_role,
    expiry_date: input.expiry_date || null,
  });
}

export async function createEmailTemplate(supabase: SupabaseClient, input: EmailTemplateInput) {
  return repo.insertEmailTemplate(supabase, input);
}

export async function createSmsTemplate(supabase: SupabaseClient, input: SmsTemplateInput) {
  return repo.insertSmsTemplate(supabase, input);
}

/**
 * Event -> Template -> Recipient -> Provider -> Log (blueprint §16). The
 * log write always happens — success or failure — via the admin client,
 * since email_logs has no insert policy for regular sessions (0023).
 * A failed send is a recorded fact, not a silently lost one.
 */
export async function sendTemplatedEmail(
  supabase: SupabaseClient,
  input: {
    templateId: string;
    recipientEmail: string;
    recipientGroup: string | null;
    variables: Record<string, string>;
    senderId: string | null;
  },
): Promise<{ sent: boolean; error?: string }> {
  const templates = await repo.listEmailTemplates(supabase);
  const template = templates.find((t) => t.id === input.templateId);
  if (!template) throw new Error("Template not found.");

  const subject = renderTemplate(template.subject, input.variables);
  const body = renderTemplate(template.body, input.variables);
  const admin = createAdminClient();

  try {
    await sendEmail({ to: input.recipientEmail, subject, html: body });
    await repo.insertEmailLog(admin, {
      sender_id: input.senderId,
      recipient_email: input.recipientEmail,
      recipient_group: input.recipientGroup,
      subject,
      body,
      status: "sent",
      error: null,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await repo.insertEmailLog(admin, {
      sender_id: input.senderId,
      recipient_email: input.recipientEmail,
      recipient_group: input.recipientGroup,
      subject,
      body,
      status: "failed",
      error: message,
    });
    return { sent: false, error: message };
  }
}
