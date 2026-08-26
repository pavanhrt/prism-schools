"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createGuardianSchema,
  linkPortalAccountSchema,
  type CreateGuardianInput,
  type LinkPortalAccountInput,
} from "@/validations/guardians";
import {
  createGuardianAction,
  createParentLoginAction,
  linkStudentPortalAction,
  sendParentPasswordResetAction,
  setGuardianPortalAccessAction,
} from "@/features/students/actions";
import type { Guardian } from "@/types/guardians";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GuardianWithStatus = Guardian & { is_primary: boolean; portalStatus: "active" | "disabled" | null };

export function GuardiansPanel({
  studentId,
  studentUserId,
  guardians,
}: {
  studentId: string;
  studentUserId: string | null;
  guardians: GuardianWithStatus[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const guardianForm = useForm<CreateGuardianInput>({
    resolver: zodResolver(createGuardianSchema),
    defaultValues: { student_id: studentId, relationship: "father", is_primary: guardians.length === 0 },
  });
  const studentLinkForm = useForm<LinkPortalAccountInput>({ resolver: zodResolver(linkPortalAccountSchema) });

  async function onAddGuardian(values: CreateGuardianInput) {
    setError(null);
    const result = await createGuardianAction(values);
    if (!result.ok) { setError(result.error); return; }
    guardianForm.reset({ student_id: studentId, full_name: "", phone: "", email: "", relationship: "father", is_primary: false });
    router.refresh();
  }

  async function onLinkStudent(values: LinkPortalAccountInput) {
    setError(null);
    const result = await linkStudentPortalAction(studentId, values);
    if (!result.ok) { setError(result.error); return; }
    studentLinkForm.reset({ email: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guardians &amp; portal access</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm text-slate-500">
            Student login: {studentUserId ? <Badge variant="success">linked</Badge> : <Badge variant="outline">not linked</Badge>}
          </p>
          {!studentUserId && (
            <form onSubmit={studentLinkForm.handleSubmit(onLinkStudent)} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="student-link-email">Link an existing account by email</Label>
                <Input id="student-link-email" type="email" {...studentLinkForm.register("email")} />
              </div>
              <Button type="submit" size="sm" disabled={studentLinkForm.formState.isSubmitting}>Link</Button>
            </form>
          )}
        </div>

        <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-200 pt-3">
          {guardians.map((g) => (
            <GuardianRow key={g.id} guardian={g} studentId={studentId} onChanged={() => router.refresh()} />
          ))}
          {guardians.length === 0 && <p className="py-3 text-sm text-slate-400">No guardians on file.</p>}
        </div>

        <form onSubmit={guardianForm.handleSubmit(onAddGuardian)} className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <input type="hidden" {...guardianForm.register("student_id")} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Name</Label>
              <Input id="full_name" {...guardianForm.register("full_name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="relationship">Relationship</Label>
              <select id="relationship" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...guardianForm.register("relationship")}>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...guardianForm.register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...guardianForm.register("email")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...guardianForm.register("is_primary")} />
            Primary contact
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={guardianForm.formState.isSubmitting} className="self-start">
            Add guardian
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GuardianRow({
  guardian,
  studentId,
  onChanged,
}: {
  guardian: GuardianWithStatus;
  studentId: string;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>,
    fallbackNotice?: string,
  ) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const shown = "message" in result ? result.message : undefined;
      if (shown ?? fallbackNotice) setNotice(shown ?? fallbackNotice!);
      onChanged();
    });
  }

  return (
    <div className="flex flex-col gap-2 py-2.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-slate-900">{guardian.full_name}</span>{" "}
          <span className="text-sm text-slate-500 capitalize">({guardian.relationship})</span>
          {guardian.is_primary && <Badge variant="outline" className="ml-2">primary</Badge>}
        </div>
        {!guardian.user_id ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => createParentLoginAction(guardian.id, studentId))}
          >
            Create Parent Login
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={guardian.portalStatus === "disabled" ? "outline" : "success"}>
              Portal Access: {guardian.portalStatus === "disabled" ? "Disabled" : "Active"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => sendParentPasswordResetAction(guardian.id, studentId), "Password reset email sent.")}
            >
              Send Password Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => setGuardianPortalAccessAction(guardian.id, studentId, guardian.portalStatus === "disabled"),
                  guardian.portalStatus === "disabled" ? "Portal access enabled." : "Portal access disabled.",
                )
              }
            >
              {guardian.portalStatus === "disabled" ? "Enable Portal Access" : "Disable Portal Access"}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">{guardian.phone}{guardian.email ? ` · ${guardian.email}` : ""}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {notice && <p className="text-xs text-emerald-600">{notice}</p>}
    </div>
  );
}
