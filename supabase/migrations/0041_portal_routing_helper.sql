-- Phase — Parent Portal final corrections (2)
--
-- 1. Login/reset-password routing was doing
--      supabase.from("user_roles").select("roles(portal_access)")
--    as the signed-in user. user_roles_select does let a caller read their
--    own rows (0004_rls.sql), but the embedded roles(...) join also has to
--    pass roles_select, which requires roles.view — a plain parent/student
--    doesn't hold that permission, so the nested "roles" object comes back
--    null (PostgREST silently drops an embedded resource the caller can't
--    read, rather than erroring), and portal_access reads as false. Net
--    effect: a parent could be routed to /admin/dashboard instead of
--    /portal/dashboard. Fixing this app-side isn't possible without either
--    granting roles.view broadly (weakens an unrelated RLS boundary) or
--    this: a narrow SECURITY DEFINER function that answers exactly one
--    question — "does the caller's own role set include portal access" —
--    without exposing role rows themselves. Same pattern as
--    has_permission()/has_role() (0003_rbac.sql) and assign_parent_role()
--    (0039), all of which read auth.uid() internally and take no
--    caller-supplied identity argument, so there's no way to ask about
--    anyone but yourself.
create or replace function public.is_portal_user()
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
      and r.portal_access = true
  );
$$;

-- Same lesson learned from 0040: `revoke ... from public` alone does not
-- remove Supabase's project-level default privilege that grants execute
-- directly to the named `anon` role at function-creation time. Revoke it
-- explicitly.
revoke all on function public.is_portal_user() from public;
revoke all on function public.is_portal_user() from anon;
grant execute on function public.is_portal_user() to authenticated;
