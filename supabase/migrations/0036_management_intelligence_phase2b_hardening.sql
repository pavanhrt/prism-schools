-- Management Intelligence Phase 2B: correctness hardening.
--
-- 1) Explicit exam comparability metadata. Performance trends must never be
--    inferred from exam name text, created_at ordering, or term ordering —
--    only from an admin-configured comparison_group + sequence_no. Both
--    columns are nullable; an exam with no comparison_group can never be
--    auto-compared to anything, which is the safe default for every
--    existing exam row.
alter table public.exams
  add column comparison_group text,
  add column sequence_no integer;

comment on column public.exams.comparison_group is
  'Admin-configured label identifying a set of mutually comparable exams (e.g. "Term Exams"). Null means this exam has no established comparison group and must never be auto-compared to another exam.';
comment on column public.exams.sequence_no is
  'Ordering within comparison_group, used to deterministically pick the "previous" comparable exam. Never inferred from created_at.';

create index exams_comparison_group_idx on public.exams (comparison_group, sequence_no) where comparison_group is not null;

-- 2) Grouped, RLS-respecting count of active (OPEN/ACKNOWLEDGED) management
--    alerts per student. Monthly Review previously fetched up to pageSize
--    500 raw alert rows to build this count in application code, but
--    repository.listAlerts silently clamps pageSize to 100 — undercounting
--    once a school has more than 100 active alerts. A grouped SQL aggregate
--    avoids loading every alert row just to count them, and stays correct
--    at any volume.
create or replace function public.count_active_management_alerts_by_student()
returns table(student_id uuid, alert_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select student_id, count(*) as alert_count
  from public.management_alerts
  where status in ('OPEN', 'ACKNOWLEDGED') and student_id is not null
  group by student_id;
$$;

revoke all on function public.count_active_management_alerts_by_student() from public, anon;
grant execute on function public.count_active_management_alerts_by_student() to authenticated;

comment on function public.count_active_management_alerts_by_student() is
  'security invoker: runs as the calling role, so the existing management_alerts RLS select policy (management_intelligence.view) still governs which rows are counted.';
