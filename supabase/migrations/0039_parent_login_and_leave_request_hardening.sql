-- Phase — Parent Portal final hardening
-- 1. A narrow, permission-checked RPC so the "Create Parent Login" admin
--    flow can assign the existing `parent` role without needing the caller
--    to also hold roles.manage (user_roles/roles are roles.manage-gated —
--    see 0004_rls.sql — but granting a school registrar roles.manage just
--    so they can link a guardian would be a much bigger privilege grant
--    than this narrowly-scoped action needs). Mirrors the SECURITY DEFINER
--    + in-function has_permission() check pattern already established by
--    find_auth_user_id_for_linking (0024_portal_access.sql) and
--    find_user_id_by_email (0005_rbac_helpers.sql). Idempotent — safe to
--    call even if the guardian already holds the role.
create or replace function public.assign_parent_role(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_role_id uuid;
begin
  if not public.has_permission('students.edit') then
    raise exception 'Forbidden';
  end if;

  select id into parent_role_id from public.roles where key = 'parent';
  if parent_role_id is null then
    raise exception 'parent role not found';
  end if;

  insert into public.user_roles (user_id, role_id, assigned_by)
  values (p_user_id, parent_role_id, auth.uid())
  on conflict (user_id, role_id) do nothing;
end;
$$;

revoke all on function public.assign_parent_role(uuid) from public;
grant execute on function public.assign_parent_role(uuid) to authenticated;

-- 2. Harden student_leave_requests' INSERT policy. The previous policy
--    (0038_parent_portal_enhancements.sql) only checked ownership and
--    requested_by — it never constrained the row's own status/review
--    columns, so a parent driving PostgREST directly (not through
--    submitLeaveRequestAction, which always sends status='submitted' and
--    omits the review columns) could INSERT a row that already claims
--    status='approved' or pre-fills reviewed_by/reviewed_at/review_note.
--    The UPDATE policy already blocks a parent from *changing* status
--    after the fact, but that's not the same as blocking a pre-approved
--    INSERT. This closes that gap at the same layer the rest of this
--    table's security lives in — RLS, not application code.
drop policy student_leave_requests_insert on public.student_leave_requests;
create policy student_leave_requests_insert on public.student_leave_requests
  for insert with check (
    public.is_own_student(student_id)
    and requested_by = auth.uid()
    and status = 'submitted'
    and reviewed_by is null
    and reviewed_at is null
    and review_note is null
  );
