import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import {
  listPermissionsForRole,
  listRoles,
  listUsersWithRoles,
} from "@/features/rbac/repository";
import { RolesManager } from "@/features/rbac/components/roles-manager";
import type { Permission } from "@/types/rbac";

export default async function RolesPage() {
  const supabase = await createClient();
  const [roles, users, canManage] = await Promise.all([
    listRoles(supabase),
    listUsersWithRoles(supabase),
    hasPermission("roles.manage"),
  ]);

  const permissionsByRole: Record<string, Permission[]> = {};
  await Promise.all(
    roles.map(async (role) => {
      permissionsByRole[role.id] = await listPermissionsForRole(supabase, role.id);
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Roles &amp; Users</h1>
        <p className="text-sm text-slate-500">
          Every permission check in the app — and every RLS policy — reads from
          these same tables, so this page is the actual source of truth, not
          just a display of it.
        </p>
      </div>
      <RolesManager
        roles={roles}
        permissionsByRole={permissionsByRole}
        users={users}
        canManage={canManage}
      />
    </div>
  );
}
