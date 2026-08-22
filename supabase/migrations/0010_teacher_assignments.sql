-- Phase 3 — Teacher assignments
-- "Teacher" here means a user holding the teacher role (Phase 1 RBAC),
-- not a row in a staff HR table — that table doesn't exist until Phase 6
-- and nothing in Academics needs its salary/department/employment fields.
--
-- subject_id null = this teacher is the class/homeroom teacher for this
-- section (grants daily attendance rights); subject_id set = this teacher
-- teaches that subject to that section (grants homework rights for it).

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id),
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  section_id uuid not null references public.sections(id),
  subject_id uuid references public.subjects(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint teacher_assignments_unique
    unique (teacher_id, academic_year_id, class_id, section_id, subject_id)
);

-- The unique constraint above doesn't dedupe subject_id IS NULL rows
-- (NULL <> NULL in Postgres), so the "class teacher" case needs its own
-- partial index: one homeroom assignment per teacher per section per year.
create unique index teacher_assignments_one_homeroom_per_teacher
  on public.teacher_assignments (teacher_id, academic_year_id, class_id, section_id)
  where subject_id is null;

create index teacher_assignments_class_section_idx
  on public.teacher_assignments (class_id, section_id, academic_year_id);

create trigger teacher_assignments_touch
  before update on public.teacher_assignments
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- Assignment-scoped RLS helpers — used by this file and by the
-- lesson_plans/homework/student_attendance policies in 0011 and 0012.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin') or public.has_role('school_admin');
$$;

-- Homeroom/class teacher for this exact section this year — the only
-- people (besides admins) allowed to mark daily attendance.
create or replace function public.is_class_teacher(
  p_class_id uuid, p_section_id uuid, p_academic_year_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments
    where teacher_id = auth.uid()
      and class_id = p_class_id
      and section_id = p_section_id
      and academic_year_id = p_academic_year_id
      and subject_id is null
  );
$$;

-- Teaches this subject to this exact section this year — grants homework
-- rights for that section/subject.
create or replace function public.is_subject_teacher(
  p_class_id uuid, p_section_id uuid, p_subject_id uuid, p_academic_year_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments
    where teacher_id = auth.uid()
      and class_id = p_class_id
      and section_id = p_section_id
      and subject_id = p_subject_id
      and academic_year_id = p_academic_year_id
  );
$$;

-- Teaches this subject to this class, any section — lesson plans are
-- class-level (curriculum pacing), not section-specific.
create or replace function public.teaches_subject(
  p_class_id uuid, p_subject_id uuid, p_academic_year_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments
    where teacher_id = auth.uid()
      and class_id = p_class_id
      and subject_id = p_subject_id
      and academic_year_id = p_academic_year_id
  );
$$;


alter table public.teacher_assignments enable row level security;

create policy teacher_assignments_select on public.teacher_assignments
  for select using (
    public.has_permission('academics.view')
    or teacher_id = auth.uid()
  );
create policy teacher_assignments_write on public.teacher_assignments
  for all using (public.has_permission('teachers.assign'))
  with check (public.has_permission('teachers.assign'));
