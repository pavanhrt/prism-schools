-- Phase 2 — Admissions / CRM
-- Blueprint §28.4: a real 4-stage funnel — Inquiry -> Followup ->
-- Application -> Admission — replacing the legacy schema's 2-stage jump
-- straight from admission_inquiries to students.

create table public.admission_inquiries (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_name text not null,
  email text,
  phone text not null,
  class_requested_id uuid references public.classes(id),
  academic_year_id uuid references public.academic_years(id),
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'followed_up', 'converted', 'closed')),
  source text not null default 'walk_in'
    check (source in ('web', 'walk_in', 'phone', 'referral', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index admission_inquiries_status_idx on public.admission_inquiries (status);

create trigger admission_inquiries_touch
  before update on public.admission_inquiries
  for each row execute function public.touch_updated_at();


create table public.inquiry_followups (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.admission_inquiries(id) on delete cascade,
  notes text not null,
  followup_date date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index inquiry_followups_inquiry_id_idx on public.inquiry_followups (inquiry_id);


-- An application is a fuller form than an inquiry — it collects everything
-- Students needs, so admitting one is a straight field copy, not a guess.
-- student_id is added by 0008_students.sql once the students table exists.
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.admission_inquiries(id),
  first_name text not null,
  last_name text not null,
  dob date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  blood_group text,
  father_name text,
  mother_name text,
  guardian_phone text,
  email text,
  phone text not null,
  address text,
  previous_school text,
  class_applying_id uuid not null references public.classes(id),
  academic_year_id uuid not null references public.academic_years(id),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected')),
  decision_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index applications_inquiry_id_idx on public.applications (inquiry_id);
create index applications_status_idx on public.applications (status);

create trigger applications_touch
  before update on public.applications
  for each row execute function public.touch_updated_at();
