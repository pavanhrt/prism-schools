-- Phase 1 — Auth profile + RBAC
-- Replaces the legacy pattern of 26 pages doing
-- `if ($_SESSION['user_role'] === 'Admin')` with real, server-enforced tables.
-- roles/permissions/role_permissions/user_roles existed as an unused table
-- in the old schema (`roles`, never wired to a `Role.php` call) — this is
-- that concept, actually connected.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row the moment someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,               -- e.g. 'school_admin'
  name text not null,                     -- e.g. 'School Admin'
  description text,
  portal_access boolean not null default false,
  is_system boolean not null default false,  -- seeded roles; blocks accidental delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger roles_touch
  before update on public.roles
  for each row execute function public.touch_updated_at();


create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,               -- e.g. 'academics.edit'
  module text not null,                   -- e.g. 'academics'
  description text,
  created_at timestamptz not null default now()
);


create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);


create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  primary key (user_id, role_id)
);

create index user_roles_user_id_idx on public.user_roles (user_id);


create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address inet,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index login_attempts_email_time_idx
  on public.login_attempts (email, attempted_at desc);


-- Permission check used throughout RLS policies and the app's server-side
-- permission helper. security definer so it can read role_permissions even
-- though that table's own RLS restricts direct reads to roles.view holders.
create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = permission_key
  );
$$;

-- Convenience check for role-shaped (not permission-shaped) policies —
-- e.g. "is this caller a student", used once we add ownership-scoped
-- tables in Phase 2+.
create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.key = role_key
  );
$$;
