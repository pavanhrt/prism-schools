-- Phase 7 — Communication
-- Notices are read by every signed-in user (role-targeted, not access-
-- controlled — a notice targeted at "teacher" isn't a secret, it's just
-- not relevant to everyone). Templates and logs are staff-only.

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_role text not null default 'all',
  status text not null default 'active' check (status in ('draft', 'active', 'expired')),
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index notices_status_idx on public.notices (status);

create trigger notices_touch
  before update on public.notices
  for each row execute function public.touch_updated_at();


create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject text not null,
  body text not null,
  tags_hint text default '{student_name}, {school_name}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger email_templates_touch
  before update on public.email_templates
  for each row execute function public.touch_updated_at();


create table public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider_template_id text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger sms_templates_touch
  before update on public.sms_templates
  for each row execute function public.touch_updated_at();


create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) default auth.uid(),
  recipient_email text not null,
  recipient_group text,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index email_logs_created_idx on public.email_logs (created_at desc);


create table public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) default auth.uid(),
  recipient_phone text not null,
  recipient_group text,
  message text not null,
  provider text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create index sms_logs_created_idx on public.sms_logs (created_at desc);


alter table public.notices         enable row level security;
alter table public.email_templates enable row level security;
alter table public.sms_templates   enable row level security;
alter table public.email_logs      enable row level security;
alter table public.sms_logs        enable row level security;

create policy notices_select on public.notices
  for select using (auth.role() = 'authenticated');
create policy notices_insert on public.notices
  for insert with check (public.has_permission('communication.create'));
create policy notices_update on public.notices
  for update using (public.has_permission('communication.create'));

create policy email_templates_select on public.email_templates
  for select using (public.has_permission('communication.manage_templates'));
create policy email_templates_write on public.email_templates
  for all using (public.has_permission('communication.manage_templates'))
  with check (public.has_permission('communication.manage_templates'));

create policy sms_templates_select on public.sms_templates
  for select using (public.has_permission('communication.manage_templates'));
create policy sms_templates_write on public.sms_templates
  for all using (public.has_permission('communication.manage_templates'))
  with check (public.has_permission('communication.manage_templates'));

create policy email_logs_select on public.email_logs
  for select using (public.has_permission('communication.view_logs'));
create policy sms_logs_select on public.sms_logs
  for select using (public.has_permission('communication.view_logs'));
-- No insert policy on either log table for regular sessions — writes go
-- through the service-role client from the notification service, same
-- pattern as login_attempts (Phase 1) and the Razorpay webhook (Phase 5).
