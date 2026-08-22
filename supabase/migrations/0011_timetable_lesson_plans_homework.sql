-- Phase 3 — Timetable, Lesson Plans, Homework

create table public.timetables (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  section_id uuid not null references public.sections(id),
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid references auth.users(id),
  day_of_week text not null
    check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time not null,
  end_time time not null,
  room_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint timetables_time_range check (end_time > start_time)
);

create index timetables_section_day_idx
  on public.timetables (class_id, section_id, day_of_week, academic_year_id);

create trigger timetables_touch
  before update on public.timetables
  for each row execute function public.touch_updated_at();

-- Timetable is set centrally by administration, same trust level as
-- classes/sections/subjects — reuses academics.* rather than a new
-- permission, and every signed-in user can already read it via
-- academics.view (Phase 1).
alter table public.timetables enable row level security;

create policy timetables_select on public.timetables
  for select using (auth.role() = 'authenticated');
create policy timetables_insert on public.timetables
  for insert with check (public.has_permission('academics.create'));
create policy timetables_update on public.timetables
  for update using (public.has_permission('academics.edit'));
create policy timetables_delete on public.timetables
  for delete using (public.has_permission('academics.delete'));


create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  subject_id uuid not null references public.subjects(id),
  topic_title text not null,
  description text,
  planned_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index lesson_plans_class_subject_idx
  on public.lesson_plans (class_id, subject_id, academic_year_id);

create trigger lesson_plans_touch
  before update on public.lesson_plans
  for each row execute function public.touch_updated_at();

alter table public.lesson_plans enable row level security;

create policy lesson_plans_select on public.lesson_plans
  for select using (public.has_permission('lesson_plans.view'));
create policy lesson_plans_insert on public.lesson_plans
  for insert with check (
    public.is_admin()
    or (
      public.has_permission('lesson_plans.create')
      and public.teaches_subject(class_id, subject_id, academic_year_id)
    )
  );
create policy lesson_plans_update on public.lesson_plans
  for update using (
    public.is_admin()
    or (
      public.has_permission('lesson_plans.edit')
      and public.teaches_subject(class_id, subject_id, academic_year_id)
    )
  );


create table public.homework (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  section_id uuid not null references public.sections(id),
  subject_id uuid not null references public.subjects(id),
  homework_date date not null,
  submission_date date not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint homework_submission_after_assigned check (submission_date >= homework_date)
);

create index homework_class_section_idx
  on public.homework (class_id, section_id, academic_year_id);

create trigger homework_touch
  before update on public.homework
  for each row execute function public.touch_updated_at();

alter table public.homework enable row level security;

create policy homework_select on public.homework
  for select using (public.has_permission('homework.view'));
create policy homework_insert on public.homework
  for insert with check (
    public.is_admin()
    or (
      public.has_permission('homework.create')
      and public.is_subject_teacher(class_id, section_id, subject_id, academic_year_id)
    )
  );
create policy homework_update on public.homework
  for update using (
    public.is_admin()
    or (
      public.has_permission('homework.edit')
      and public.is_subject_teacher(class_id, section_id, subject_id, academic_year_id)
    )
  );
