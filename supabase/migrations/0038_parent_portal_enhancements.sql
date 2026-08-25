-- Non-AI Parent Portal enhancements.
--
-- The core parent/child security model (guardians, student_guardians,
-- is_own_student(), additive ownership RLS) already exists from Phase 8
-- (0024_portal_access.sql) and is reused as-is, unchanged, by everything
-- below. This migration adds only what's genuinely new:
--
-- 1) parent_notifications — a deterministic, rule-based notification store
--    (never AI-generated), refreshed by the portal's own session on read,
--    using the same fingerprint-upsert pattern as management_alerts so a
--    condition is updated in place rather than duplicated.
-- 2) student_leave_requests — a parent-submitted absence request, reusing
--    is_own_student() for parent-side authorization and the existing
--    attendance.edit permission for staff review (no new permission).
-- 3) guardians.notification_enabled — a per-guardian opt-out, since
--    notifications are generated per auth user, not per student.
--
-- No changes to any existing table's columns or policies.

-- ---------------------------------------------------------------------
-- Parent notifications
-- ---------------------------------------------------------------------
create table public.parent_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  fingerprint text not null,
  category text not null check (category in ('ATTENDANCE', 'EXAM', 'RESULT', 'FEE', 'ANNOUNCEMENT', 'LEAVE_REQUEST')),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint parent_notifications_unique_fingerprint unique (user_id, fingerprint)
);

create index parent_notifications_user_unread_idx
  on public.parent_notifications (user_id, is_read, created_at desc);

alter table public.parent_notifications enable row level security;

-- A parent only ever sees/mutates their own notification rows. The
-- refresh function runs under the caller's own session (never
-- service-role), so its inserts must satisfy this same check.
create policy parent_notifications_select on public.parent_notifications
  for select using (user_id = auth.uid());
create policy parent_notifications_insert on public.parent_notifications
  for insert with check (user_id = auth.uid());
create policy parent_notifications_update on public.parent_notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.parent_notifications from anon;
grant select, insert, update on table public.parent_notifications to authenticated;

comment on table public.parent_notifications is
  'Deterministic, rule-based portal notifications (never AI-generated). Refreshed in place by fingerprint (user_id, fingerprint) — a still-active condition updates its existing row rather than duplicating it.';

-- ---------------------------------------------------------------------
-- Student leave / absence requests
-- ---------------------------------------------------------------------
create table public.student_leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_leave_requests_date_range check (to_date >= from_date)
);

create index student_leave_requests_student_idx on public.student_leave_requests (student_id, from_date desc);
create index student_leave_requests_status_idx on public.student_leave_requests (status, created_at desc);

create trigger student_leave_requests_touch
  before update on public.student_leave_requests
  for each row execute function public.touch_updated_at();

alter table public.student_leave_requests enable row level security;

-- Parents can see and submit requests for their own linked children only;
-- staff who can already correct attendance (attendance.edit) can see and
-- review every request. Parents can never set/change `status` themselves —
-- the update policy is staff-only, so approval can't be self-granted.
create policy student_leave_requests_select on public.student_leave_requests
  for select using (public.has_permission('attendance.edit') or public.is_own_student(student_id));
create policy student_leave_requests_insert on public.student_leave_requests
  for insert with check (public.is_own_student(student_id) and requested_by = auth.uid());
create policy student_leave_requests_update on public.student_leave_requests
  for update using (public.has_permission('attendance.edit'))
  with check (public.has_permission('attendance.edit'));

revoke all on table public.student_leave_requests from anon;
grant select, insert on table public.student_leave_requests to authenticated;
grant update on table public.student_leave_requests to authenticated;

comment on table public.student_leave_requests is
  'Parent-submitted absence requests. Distinct from staff public.leave_requests. Approval/rejection is staff-only (attendance.edit) — the parent-facing insert policy cannot set status.';

-- ---------------------------------------------------------------------
-- Per-guardian notification opt-out
-- ---------------------------------------------------------------------
alter table public.guardians
  add column notification_enabled boolean not null default true;
