"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, type LoginInput } from "@/validations/auth";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  // login_attempts has no insert policy for regular sessions on purpose
  // (supabase/migrations/0004_rls.sql) — only the service-role client may
  // write to it, so a caller can never erase or spoof their own history.
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .eq("success", false)
    .gte("attempted_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  const forwardedFor = (await headers()).get("x-forwarded-for");
  await admin.from("login_attempts").insert({
    email,
    ip_address: forwardedFor?.split(",")[0]?.trim() || null,
    success: !error,
  });

  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(portal_access)");
  const isPortalUser = (roleRows ?? []).some(
    (row) => (row.roles as unknown as { portal_access: boolean } | null)?.portal_access,
  );

  redirect(isPortalUser ? "/portal/dashboard" : "/admin/dashboard");
}
