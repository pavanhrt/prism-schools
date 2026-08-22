// Hand-written to match supabase/migrations/0003_rbac.sql exactly.

export interface Role {
  id: string;
  key: string;
  name: string;
  description: string | null;
  portal_access: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  key: string;
  module: string;
  description: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  status: "active" | "inactive" | "suspended";
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}
