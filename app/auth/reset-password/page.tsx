"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordSchema, type SetPasswordInput } from "@/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLogo } from "@/components/school/school-logo";
import { PRISM_SCHOOL_NAME } from "@/components/school/brand";

/**
 * Landing page for both the "Create Parent Login" invitation email and the
 * "Send Password Reset" email — Supabase's invite and recovery links both
 * land here carrying a one-time session, and both flows end the same way:
 * the person sets a password, never sees or transmits one in plaintext.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({ resolver: zodResolver(setPasswordSchema) });

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        settled = true;
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      if (data.session) {
        setReady(true);
      } else {
        setLinkInvalid(true);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function onSubmit(values: SetPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
      return;
    }

    const { data: roleRows } = await supabase.from("user_roles").select("roles(portal_access)");
    const isPortalUser = (roleRows ?? []).some(
      (row) => (row.roles as unknown as { portal_access: boolean } | null)?.portal_access,
    );
    setDone(true);
    router.push(isPortalUser ? "/portal/dashboard" : "/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-prism-bg px-4">
      <SchoolLogo size={64} preload />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set your password — {PRISM_SCHOOL_NAME}</CardTitle>
        </CardHeader>
        <CardContent>
          {linkInvalid && (
            <p className="text-sm text-red-600">
              This link is invalid or has expired. Ask the school office to send a new one.
            </p>
          )}
          {!linkInvalid && !ready && <p className="text-sm text-slate-500">Verifying your link…</p>}
          {ready && !done && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>
              {serverError && <p className="text-sm text-red-600">{serverError}</p>}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Saving…" : "Set password"}
              </Button>
            </form>
          )}
          {done && <p className="text-sm text-emerald-600">Password set — taking you in…</p>}
        </CardContent>
      </Card>
    </div>
  );
}
