-- Phase 2 — Students
-- The fix for the legacy system's #1 finding: Student::promote() in the old
-- PHP app did `UPDATE students SET class_id, section_id` in place, wiping
-- last year's placement. Here, students holds only identity/demographic
-- data; class/section/roll_no live in student_enrollments, one row per
-- student per academic year. "Current class" is a query, never a column.

create sequence public.student_admission_seq start 1;

create or replace function public.next_admission_no()
returns text
language plpgsql
as $$
declare
  prefix text;
  next_val bigint;
begin
  select admission_prefix into prefix from public.school_settings where id = 1;
  next_val := nextval('public.student_admission_seq');
  return coalesce(prefix, 'ADM-') || lpad(next_val::text, 4, '0');
end;
$$;


create table public.students (
  id uuid primary key default gen_random_uuid(),
  admission_no text not null unique default public.next_admission_no(),
  first_name text not null,
  last_name text not null,
  dob date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  blood_group text,
  religion text,
  email text,
  phone text,
  father_name text,
  mother_name text,
  guardian_phone text,
  address text,
  previous_school text,
  photo_url text,
  admission_date date not null default current_date,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'passed_out', 'struck_off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index students_status_idx on public.students (status);

create trigger students_touch
  before update on public.students
  for each row execute function public.touch_updated_at();


create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  section_id uuid not null references public.sections(id),
  roll_no text,
  status text not null default 'enrolled'
    check (status in ('enrolled', 'promoted', 'repeated', 'transferred_out', 'graduated')),
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint student_enrollments_one_per_year unique (student_id, academic_year_id)
);

-- Same invariant pattern as academic_years.is_current (§0002): only one
-- current enrollment per student, enforced by the database, not by app
-- discipline.
create unique index student_enrollments_one_current
  on public.student_enrollments (student_id)
  where is_current;

create index student_enrollments_class_section_idx
  on public.student_enrollments (class_id, section_id);

create trigger student_enrollments_touch
  before update on public.student_enrollments
  for each row execute function public.touch_updated_at();


-- Set once an approved application is admitted — see features/admissions
-- service's admitApplication, which inserts the student row and stamps
-- this in the same operation.
alter table public.applications
  add column student_id uuid references public.students(id);
