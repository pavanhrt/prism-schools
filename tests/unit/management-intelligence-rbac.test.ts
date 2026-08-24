import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/0034_management_intelligence_foundation.sql", "utf8");
const layout = readFileSync("app/admin/management-intelligence/layout.tsx", "utf8");
const settingsPage = readFileSync("app/admin/management-intelligence/settings/page.tsx", "utf8");
const actions = readFileSync("features/management-intelligence/actions.ts", "utf8");
const adminLayout = readFileSync("app/admin/layout.tsx", "utf8");
const managementNav = readFileSync("features/management-intelligence/components/management-nav.tsx", "utf8");

describe("management intelligence RBAC contract", () => {
  it("grants all three permissions only to Super Admin and School Admin", () => {
    const grantBlock = migration.match(/insert into public\.role_permissions[\s\S]*?on conflict do nothing;/)?.[0] ?? "";
    expect(grantBlock).toContain("r.key in ('super_admin', 'school_admin')");
    expect(grantBlock).toContain("management_intelligence.view");
    expect(grantBlock).toContain("management_intelligence.manage_alerts");
    expect(grantBlock).toContain("management_intelligence.manage_settings");
    for (const deniedRole of ["teacher", "accountant", "receptionist", "student", "parent"]) {
      expect(grantBlock).not.toContain(`'${deniedRole}'`);
    }
  });

  it("protects navigation, direct URLs, actions, and database rows independently", () => {
    expect(adminLayout).toContain('permission: "management_intelligence.view"');
    expect(layout).toContain('hasPermission("management_intelligence.view")');
    expect(settingsPage).toContain('hasPermission("management_intelligence.manage_settings")');
    expect(managementNav).toContain('hasPermission("management_intelligence.manage_settings")');
    expect(actions).toContain('requirePermission("management_intelligence.manage_alerts")');
    expect(actions).toContain('requirePermission("management_intelligence.manage_settings")');
    expect(migration).toContain("using (public.has_permission('management_intelligence.view'))");
    expect(migration).toContain("using (public.has_permission('management_intelligence.manage_alerts'))");
    expect(migration).toContain("using (public.has_permission('management_intelligence.manage_settings'))");
  });
});
