-- Phase 4 — Grade Scales
-- "Grading must be configurable" (brief §7/Module 7) — grade computation
-- happens in the app from these rows plus a student's percentage, never a
-- hardcoded A/B/C ladder.

create table public.grade_scales (
  id uuid primary key default gen_random_uuid(),
  grade_name text not null,
  min_percentage numeric(5, 2) not null,
  max_percentage numeric(5, 2) not null,
  grade_point numeric(3, 1) not null default 0,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint grade_scales_range_valid check (max_percentage > min_percentage)
);

create trigger grade_scales_touch
  before update on public.grade_scales
  for each row execute function public.touch_updated_at();

alter table public.grade_scales enable row level security;

create policy grade_scales_select on public.grade_scales
  for select using (auth.role() = 'authenticated');
create policy grade_scales_write on public.grade_scales
  for all using (public.has_permission('grades.manage'))
  with check (public.has_permission('grades.manage'));
