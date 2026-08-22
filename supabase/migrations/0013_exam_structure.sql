-- Phase 4 — Exam structure: Term -> Exam -> Exam Schedule
-- exam_schedules is class-level (no section) — the same paper is sat by
-- every section of a class together, matching the legacy schema and how
-- schools actually run exams. Per-student results still resolve to a
-- section via student_enrollments when needed for reporting.

create table public.exam_terms (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint exam_terms_year_name_unique unique (academic_year_id, name)
);

create trigger exam_terms_touch
  before update on public.exam_terms
  for each row execute function public.touch_updated_at();


create table public.exams (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.exam_terms(id),
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index exams_term_id_idx on public.exams (term_id);

create trigger exams_touch
  before update on public.exams
  for each row execute function public.touch_updated_at();


create table public.exam_schedules (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  class_id uuid not null references public.classes(id),
  subject_id uuid not null references public.subjects(id),
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  room_no text,
  max_marks_theory numeric(5, 2) not null default 80,
  max_marks_practical numeric(5, 2) not null default 0,
  pass_marks numeric(5, 2) not null default 33,
  -- The fix for the legacy schema's biggest exam-integrity gap: results
  -- have their own lifecycle, independent of the parent exam's status.
  -- Changed only via submit_results_for_review() / advance_exam_result_status()
  -- in 0014_exam_results.sql — never a raw UPDATE from the app.
  result_status text not null default 'draft'
    check (result_status in ('draft', 'submitted', 'approved', 'published', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint exam_schedules_time_range check (end_time > start_time),
  constraint exam_schedules_exam_class_subject_unique unique (exam_id, class_id, subject_id)
);

create index exam_schedules_exam_class_idx on public.exam_schedules (exam_id, class_id);

create trigger exam_schedules_touch
  before update on public.exam_schedules
  for each row execute function public.touch_updated_at();


alter table public.exam_terms     enable row level security;
alter table public.exams          enable row level security;
alter table public.exam_schedules enable row level security;

create policy exam_terms_select on public.exam_terms
  for select using (auth.role() = 'authenticated');
create policy exam_terms_insert on public.exam_terms
  for insert with check (public.has_permission('exams.create'));
create policy exam_terms_update on public.exam_terms
  for update using (public.has_permission('exams.edit'));
create policy exam_terms_delete on public.exam_terms
  for delete using (public.has_permission('exams.delete'));

create policy exams_select on public.exams
  for select using (auth.role() = 'authenticated');
create policy exams_insert on public.exams
  for insert with check (public.has_permission('exams.create'));
create policy exams_update on public.exams
  for update using (public.has_permission('exams.edit'));
create policy exams_delete on public.exams
  for delete using (public.has_permission('exams.delete'));

create policy exam_schedules_select on public.exam_schedules
  for select using (auth.role() = 'authenticated');
create policy exam_schedules_insert on public.exam_schedules
  for insert with check (public.has_permission('exams.create'));
create policy exam_schedules_update on public.exam_schedules
  for update using (public.has_permission('exams.edit'));
create policy exam_schedules_delete on public.exam_schedules
  for delete using (public.has_permission('exams.delete'));
