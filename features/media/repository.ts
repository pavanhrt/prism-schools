import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
}

export async function removeObject(supabase: SupabaseClient, bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function getPublicUrl(supabase: SupabaseClient, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function createSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
