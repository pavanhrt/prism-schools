import type { SupabaseClient } from "@supabase/supabase-js";
import type { SchoolSettings } from "@/types/settings";

export async function getSchoolSettings(supabase: SupabaseClient): Promise<SchoolSettings> {
  const { data, error } = await supabase
    .from("school_settings")
    .select("id, school_name, student_id_prefix, admission_prefix, contact_email, contact_phone, address, updated_at, updated_by")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}
