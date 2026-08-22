-- Phase 1 — Academic Setup
-- Mirrors classes/sections/subjects from the legacy school.sql, retyped to
-- uuid + audit columns. No school_id (blueprint §28.6 — deferred until a
-- second school is actually greenlit).

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  year_label text not null unique,        -- e.g. '2026-27'
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint academic_years_dates_valid check (end_date > start_date)
);

-- Only one academic year may be "current" at a time.
create unique index academic_years_one_current
  on public.academic_years (is_current)
  where is_current;

create trigger academic_years_touch
  before update on public.academic_years
  for each row execute function public.touch_updated_at();


create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- e.g. 'Class 5'
  sequence smallint not null,             -- promotion/sort order, replaces class_numeric
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint classes_sequence_unique unique (sequence)
);

create trigger classes_touch
  before update on public.classes
  for each row execute function public.touch_updated_at();


create table public.sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,                     -- e.g. 'A'
  capacity smallint not null default 40,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint sections_capacity_positive check (capacity > 0),
  constraint sections_class_name_unique unique (class_id, name)
);

create index sections_class_id_idx on public.sections (class_id);

create trigger sections_touch
  before update on public.sections
  for each row execute function public.touch_updated_at();


create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  code text,
  subject_type text not null default 'theory'
    check (subject_type in ('theory', 'practical', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint subjects_class_name_unique unique (class_id, name)
);

create index subjects_class_id_idx on public.subjects (class_id);

create trigger subjects_touch
  before update on public.subjects
  for each row execute function public.touch_updated_at();
