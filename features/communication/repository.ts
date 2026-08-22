import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailLog, EmailTemplate, Notice, SmsTemplate } from "@/types/communication";

// ---- Notices -----------------------------------------------------------------

export async function listNotices(supabase: SupabaseClient): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertNotice(
  supabase: SupabaseClient,
  input: Pick<Notice, "title" | "message" | "target_role" | "expiry_date">,
): Promise<Notice> {
  const { data, error } = await supabase.from("notices").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Templates -----------------------------------------------------------------

export async function listEmailTemplates(supabase: SupabaseClient): Promise<EmailTemplate[]> {
  const { data, error } = await supabase.from("email_templates").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertEmailTemplate(
  supabase: SupabaseClient,
  input: Pick<EmailTemplate, "name" | "subject" | "body">,
): Promise<EmailTemplate> {
  const { data, error } = await supabase.from("email_templates").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listSmsTemplates(supabase: SupabaseClient): Promise<SmsTemplate[]> {
  const { data, error } = await supabase.from("sms_templates").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function insertSmsTemplate(
  supabase: SupabaseClient,
  input: Pick<SmsTemplate, "name" | "body">,
): Promise<SmsTemplate> {
  const { data, error } = await supabase.from("sms_templates").insert(input).select().single();
  if (error) throw error;
  return data;
}

// ---- Logs (admin client only — see 0023's RLS comment) ------------------------

export async function listEmailLogs(supabase: SupabaseClient): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function insertEmailLog(
  adminClient: SupabaseClient,
  input: Pick<EmailLog, "sender_id" | "recipient_email" | "recipient_group" | "subject" | "body" | "status" | "error">,
): Promise<void> {
  const { error } = await adminClient.from("email_logs").insert(input);
  if (error) throw error;
}
