import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_MEDIA_BUCKET } from "@/types/media";

export interface PublicStorageObject {
  name: string;
  id: string | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
}

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

/** Lists one controlled folder in the public website bucket only. */
export async function listPublicFolder(supabase: SupabaseClient, folder: string, limit = 100): Promise<PublicStorageObject[]> {
  const { data, error } = await supabase.storage.from(PUBLIC_MEDIA_BUCKET).list(folder, {
    limit,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return (data ?? []) as PublicStorageObject[];
}

export async function removePublicObject(supabase: SupabaseClient, path: string): Promise<void> {
  return removeObject(supabase, PUBLIC_MEDIA_BUCKET, path);
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
