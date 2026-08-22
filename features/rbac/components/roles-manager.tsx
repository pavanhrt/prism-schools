"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { assignRoleAction, revokeRoleAction } from "@/features/rbac/actions";
import type { Permission, Profile, Role } from "@/types/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type UserRow = { profile: Profile; roles: { key: string; name: string }[] };

export function RolesManager({
  roles,
  permissionsByRole,
  users: userRows,
  canManage,
}: {
  roles: Role[];
  permissionsByRole: Record<string, Permission[]>;
  users: UserRow[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ email: string; roleId: string }>();

  async function onAssign(values: { email: string; roleId: string }) {
    setError(null);
    const result = await assignRoleAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ email: "", roleId: "" });
    router.refresh();
  }

  function revoke(userId: string, roleId: string) {
    startTransition(async () => {
      const result = await revokeRoleAction(userId, roleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Roles &amp; their permissions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role.name}
                  {role.portal_access && <Badge variant="outline">portal</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(permissionsByRole[role.id] ?? []).map((p) => (
                    <Badge key={p.id}>{p.key}</Badge>
                  ))}
                  {(permissionsByRole[role.id] ?? []).length === 0 && (
                    <span className="text-xs text-slate-400">No permissions granted</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {canManage && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Assign a role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAssign)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">User email</Label>
                <Input id="email" type="email" placeholder="teacher@school.com" {...register("email", { required: true })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="roleId">Role</Label>
                <select
                  id="roleId"
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...register("roleId", { required: true })}
                >
                  <option value="">Choose a role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Assigning…" : "Assign role"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Users
        </h2>
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Status</TH>
              <TH>Roles</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {userRows.map(({ profile, roles: assignedRoles }) => (
              <TR key={profile.id}>
                <TD className="font-medium text-slate-900">{profile.full_name}</TD>
                <TD>
                  <Badge variant={profile.status === "active" ? "success" : "warning"}>
                    {profile.status}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedRoles.map((r) => (
                      <span key={r.key} className="inline-flex items-center gap-1">
                        <Badge variant="outline">{r.name}</Badge>
                        {canManage && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              const role = roles.find((role) => role.key === r.key);
                              if (role) revoke(profile.id, role.id);
                            }}
                            className="text-xs text-red-500 hover:underline"
                            aria-label={`Revoke ${r.name}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {assignedRoles.length === 0 && (
                      <span className="text-xs text-slate-400">No roles assigned</span>
                    )}
                  </div>
                </TD>
                <TD></TD>
              </TR>
            ))}
            {userRows.length === 0 && (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No users yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
