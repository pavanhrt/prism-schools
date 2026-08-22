import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdmissionInquiry,
  Application,
  InquiryFollowup,
  InquiryStatus,
} from "@/types/admissions";

// ---- Inquiries -------------------------------------------------------------

export async function listInquiries(
  supabase: SupabaseClient,
): Promise<AdmissionInquiry[]> {
  const { data, error } = await supabase
    .from("admission_inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type NewInquiry = Pick<
  AdmissionInquiry,
  "student_name" | "parent_name" | "email" | "phone" | "class_requested_id" | "academic_year_id" | "message" | "source"
>;

export async function insertInquiry(
  supabase: SupabaseClient,
  input: NewInquiry,
): Promise<AdmissionInquiry> {
  const { data, error } = await supabase
    .from("admission_inquiries")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInquiry(
  supabase: SupabaseClient,
  id: string,
): Promise<AdmissionInquiry | null> {
  const { data, error } = await supabase
    .from("admission_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateInquiryStatus(
  supabase: SupabaseClient,
  id: string,
  status: InquiryStatus,
): Promise<void> {
  const { error } = await supabase
    .from("admission_inquiries")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function listAllFollowups(
  supabase: SupabaseClient,
): Promise<InquiryFollowup[]> {
  const { data, error } = await supabase
    .from("inquiry_followups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listFollowups(
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<InquiryFollowup[]> {
  const { data, error } = await supabase
    .from("inquiry_followups")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertFollowup(
  supabase: SupabaseClient,
  input: Pick<InquiryFollowup, "inquiry_id" | "notes" | "followup_date">,
): Promise<InquiryFollowup> {
  const { data, error } = await supabase
    .from("inquiry_followups")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Applications ------------------------------------------------------------

export async function listApplications(
  supabase: SupabaseClient,
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getApplication(
  supabase: SupabaseClient,
  id: string,
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type NewApplication = Omit<
  Application,
  "id" | "status" | "decision_notes" | "reviewed_by" | "reviewed_at" | "student_id" | "created_at" | "updated_at" | "created_by" | "updated_by"
>;

export async function insertApplication(
  supabase: SupabaseClient,
  input: NewApplication,
): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplicationDecision(
  supabase: SupabaseClient,
  id: string,
  patch: { status: "under_review" | "approved" | "rejected"; decision_notes: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({
      ...patch,
      reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function markApplicationAdmitted(
  supabase: SupabaseClient,
  id: string,
  studentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ student_id: studentId })
    .eq("id", id);
  if (error) throw error;
}
