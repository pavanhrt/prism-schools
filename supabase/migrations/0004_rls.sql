-- Phase 1 — Row Level Security
-- This is the layer the legacy PHP app never had: authorization enforced in
-- Postgres itself, not just hidden by the UI. Every table below defaults to
-- deny-all until a policy explicitly opens it.

alter table public.academic_years enable row level security;
alter table public.classes        enable row level security;
alter table public.sections       enable row level security;
alter table public.subjects       enable row level security;
alter table public.profiles       enable row level security;
alter table public.roles          enable row level security;
alter table public.permissions    enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles     enable row level security;
alter table public.login_attempts enable row level security;

-- ---------------------------------------------------------------------
-- Academic setup: any signed-in user may read (staff and the future
-- portal both need class/section names); writes require the matching
-- granular permission.
-- ---------------------------------------------------------------------
create policy academic_years_select on public.academic_years
  for select using (auth.role() = 'authenticated');
create policy academic_years_insert on public.academic_years
  for insert with check (public.has_permission('academics.create'));
create policy academic_years_update on public.academic_years
  for update using (public.has_permission('academics.edit'));
create policy academic_years_delete on public.academic_years
  for delete using (public.has_permission('academics.delete'));

create policy classes_select on public.classes
  for select using (auth.role() = 'authenticated');
create policy classes_insert on public.classes
  for insert with check (public.has_permission('academics.create'));
create policy classes_update on public.classes
  for update using (public.has_permission('academics.edit'));
create policy classes_delete on public.classes
  for delete using (public.has_permission('academics.delete'));

create policy sections_select on public.sections
  for select using (auth.role() = 'authenticated');
create policy sections_insert on public.sections
  for insert with check (public.has_permission('academics.create'));
create policy sections_update on public.sections
  for update using (public.has_permission('academics.edit'));
create policy sections_delete on public.sections
  for delete using (public.has_permission('academics.delete'));

create policy subjects_select on public.subjects
  for select using (auth.role() = 'authenticated');
create policy subjects_insert on public.subjects
  for insert with check (public.has_permission('academics.create'));
create policy subjects_update on public.subjects
  for update using (public.has_permission('academics.edit'));
create policy subjects_delete on public.subjects
  for delete using (public.has_permission('academics.delete'));

-- ---------------------------------------------------------------------
-- Profiles: everyone can read/update their own row; users.view / .manage
-- holders can read / update anyone's.
-- ---------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.has_permission('users.view'));
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.has_permission('users.manage'));

-- ---------------------------------------------------------------------
-- RBAC tables themselves: readable by roles.view, writable by roles.manage.
-- ---------------------------------------------------------------------
create policy roles_select on public.roles
  for select using (public.has_permission('roles.view'));
create policy roles_write on public.roles
  for all using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

create policy permissions_select on public.permissions
  for select using (public.has_permission('roles.view'));
create policy permissions_write on public.permissions
  for all using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

create policy role_permissions_select on public.role_permissions
  for select using (public.has_permission('roles.view'));
create policy role_permissions_write on public.role_permissions
  for all using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.has_permission('roles.view'));
create policy user_roles_write on public.user_roles
  for all using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

-- ---------------------------------------------------------------------
-- Login attempts: written by the server (service role, bypasses RLS) on
-- every attempt, including failed/unauthenticated ones. No insert policy
-- here on purpose — regular sessions must never be able to write their
-- own audit trail.
-- ---------------------------------------------------------------------
create policy login_attempts_select on public.login_attempts
  for select using (public.has_permission('security.view_logs'));

-- ---------------------------------------------------------------------
-- Seeded (is_system) roles/permissions can't be deleted from the UI —
-- protects the RBAC bootstrap from being locked out by accident.
-- ---------------------------------------------------------------------
create or replace function public.protect_system_role()
returns trigger
language plpgsql
as $$
begin
  if old.is_system then
    raise exception 'System role "%" cannot be deleted', old.key;
  end if;
  return old;
end;
$$;

create trigger roles_protect_system
  before delete on public.roles
  for each row execute function public.protect_system_role();
