-- Phase 6 — Staff
-- Gives teacher_assignments.teacher_id (Phase 3, references auth.users
-- directly) a real HR record to eventually enrich, without ever having
-- required one — a teacher_assignments row and a staff row are both just
-- attributes of the same auth.users identity, neither is a prerequisite
-- for the other.

alter table public.school_settings
  add column staff_id_prefix text not null default 'STA-';

create sequence public.staff_no_seq start 1;

create or replace function public.next_staff_no()
returns text
language plpgsql
as $$
declare
  prefix text;
  next_val bigint;
begin
  select staff_id_prefix into prefix from public.school_settings where id = 1;
  next_val := nextval('public.staff_no_seq');
  return coalesce(prefix, 'STA-') || lpad(next_val::text, 4, '0');
end;
$$;


create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  staff_no text not null unique default public.next_staff_no(),
  first_name text not null,
  last_name text not null,
  father_name text,
  mother_name text,
  email text not null,
  phone text not null,
  emergency_contact text,
  gender text not null check (gender in ('male', 'female', 'other')),
  dob date not null,
  date_of_joining date not null default current_date,
  qualification text,
  work_experience text,
  designation text,
  department text,
  basic_salary numeric(10, 2) not null default 0 check (basic_salary >= 0),
  blood_group text,
  address text,
  photo_url text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'resigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index staff_status_idx on public.staff (status);
create index staff_user_id_idx on public.staff (user_id);

create trigger staff_touch
  before update on public.staff
  for each row execute function public.touch_updated_at();


alter table public.staff enable row level security;

create policy staff_select on public.staff
  for select using (public.has_permission('staff.view') or user_id = auth.uid());
create policy staff_insert on public.staff
  for insert with check (public.has_permission('staff.create'));
create policy staff_update on public.staff
  for update using (public.has_permission('staff.edit'));
