-- Phase 1 — RBAC helper RPC
-- profiles has no email column (email lives on auth.users, which client
-- code can never query directly). This lets a roles.manage holder resolve
-- "assign this role to <email>" without exposing the auth schema.

create or replace function public.find_user_id_by_email(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  if not public.has_permission('roles.manage') then
    raise exception 'Forbidden';
  end if;

  select id into found_id from auth.users where email = lookup_email limit 1;
  return found_id;
end;
$$;
