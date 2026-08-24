-- Management Intelligence Phase 1: deterministic attendance intelligence.
-- Reuses existing academic, enrollment, attendance, staff, leave, and RBAC tables.

-- -----------------------------------------------------------------------------
-- RBAC
-- -----------------------------------------------------------------------------
insert into public.permissions (key, module, description) values
  ('management_intelligence.view', 'management_intelligence', 'View management intelligence dashboards, attendance insights, and alerts'),
  ('management_intelligence.manage_alerts', 'management_intelligence', 'Refresh, acknowledge, resolve, and dismiss management alerts'),
  ('management_intelligence.manage_settings', 'management_intelligence', 'Configure management intelligence thresholds and the working-day calendar')
on conflict (key) do update set
  module = excluded.module,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'school_admin')
  and p.key in (
    'management_intelligence.view',
    'management_intelligence.manage_alerts',
    'management_intelligence.manage_settings'
  )
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Typed settings. Exactly one value column must match value_type.
-- -----------------------------------------------------------------------------
create table public.management_intelligence_settings (
  setting_key text primary key,
  value_type text not null check (value_type in ('numeric', 'string', 'boolean')),
  numeric_value numeric,
  string_value text,
  boolean_value boolean,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) default auth.uid(),
  constraint management_intelligence_settings_typed_value check (
    (value_type = 'numeric' and numeric_value is not null and string_value is null and boolean_value is null)
    or (value_type = 'string' and numeric_value is null and string_value is not null and boolean_value is null)
    or (value_type = 'boolean' and numeric_value is null and string_value is null and boolean_value is not null)
  )
);

create trigger management_intelligence_settings_touch
  before update on public.management_intelligence_settings
  for each row execute function public.touch_updated_at();

insert into public.management_intelligence_settings
  (setting_key, value_type, numeric_value, description)
values
  ('student_absence_warning_days', 'numeric', 3, 'Consecutive student working-day absences that trigger a warning'),
  ('student_absence_critical_days', 'numeric', 5, 'Consecutive student working-day absences that trigger a critical alert'),
  ('student_low_attendance_warning_pct', 'numeric', 75, 'Student attendance percentage below which a warning is raised'),
  ('student_low_attendance_critical_pct', 'numeric', 65, 'Student attendance percentage below which a critical alert is raised'),
  ('student_attendance_decline_points', 'numeric', 10, 'Attendance decline in percentage points that triggers a warning'),
  ('staff_absence_warning_days', 'numeric', 3, 'Consecutive unauthorized staff working-day absences that trigger a warning'),
  ('syllabus_warning_pct', 'numeric', 80, 'Reserved for Phase 2 syllabus warning threshold'),
  ('syllabus_critical_pct', 'numeric', 65, 'Reserved for Phase 2 syllabus critical threshold'),
  ('academic_decline_points', 'numeric', 10, 'Reserved for Phase 2 academic decline threshold'),
  ('fee_overdue_warning_days', 'numeric', 7, 'Reserved for Phase 2 fee overdue warning threshold'),
  ('fee_overdue_critical_days', 'numeric', 30, 'Reserved for Phase 2 fee overdue critical threshold')
on conflict (setting_key) do nothing;

-- -----------------------------------------------------------------------------
-- Reusable school working-day configuration.
-- PostgreSQL extract(dow): Sunday=0 through Saturday=6.
-- Date overrides take precedence over recurring weekly off-days.
-- -----------------------------------------------------------------------------
create table public.school_weekly_off_days (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) default auth.uid()
);

create trigger school_weekly_off_days_touch
  before update on public.school_weekly_off_days
  for each row execute function public.touch_updated_at();

insert into public.school_weekly_off_days (day_of_week, label)
values (0, 'Sunday')
on conflict (day_of_week) do nothing;

create table public.academic_calendar_days (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  calendar_date date not null,
  is_working_day boolean not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) default auth.uid(),
  constraint academic_calendar_days_unique unique (academic_year_id, calendar_date)
);

create index academic_calendar_days_year_date_idx
  on public.academic_calendar_days (academic_year_id, calendar_date);

create trigger academic_calendar_days_touch
  before update on public.academic_calendar_days
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Alert storage and immutable lifecycle audit events.
-- One fingerprint represents one rule/entity/period condition. Resolved alerts
-- are reopened in place if the deterministic condition later returns.
-- -----------------------------------------------------------------------------
create table public.management_alerts (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  rule_key text not null,
  alert_type text not null,
  category text not null check (category in ('ATTENDANCE', 'STAFF', 'ACADEMICS', 'TIMETABLE', 'PERFORMANCE', 'FEES', 'OPERATIONS')),
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  entity_type text not null,
  entity_id uuid,
  student_id uuid references public.students(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  period_start date,
  period_end date,
  title text not null,
  message text not null,
  current_value numeric,
  threshold_value numeric,
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_alerts_entity_reference check (
    (entity_type = 'student' and student_id is not null and entity_id = student_id)
    or (entity_type = 'staff' and staff_id is not null and entity_id = staff_id)
    or (entity_type not in ('student', 'staff'))
  )
);

create index management_alerts_status_severity_idx
  on public.management_alerts (status, severity, last_detected_at desc);
create index management_alerts_category_status_idx
  on public.management_alerts (category, status, last_detected_at desc);
create index management_alerts_student_idx
  on public.management_alerts (student_id, period_end desc) where student_id is not null;
create index management_alerts_staff_idx
  on public.management_alerts (staff_id, period_end desc) where staff_id is not null;
create index management_alerts_class_section_idx
  on public.management_alerts (class_id, section_id, status) where class_id is not null;

create trigger management_alerts_touch
  before update on public.management_alerts
  for each row execute function public.touch_updated_at();

create table public.management_alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.management_alerts(id) on delete cascade,
  event_type text not null check (event_type in ('CREATED', 'UPDATED', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'REOPENED', 'AUTO_RESOLVED')),
  from_status text,
  to_status text,
  note text,
  actor_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index management_alert_events_alert_time_idx
  on public.management_alert_events (alert_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS: VIEW and management mutations are deliberately separate.
-- -----------------------------------------------------------------------------
alter table public.management_intelligence_settings enable row level security;
alter table public.school_weekly_off_days enable row level security;
alter table public.academic_calendar_days enable row level security;
alter table public.management_alerts enable row level security;
alter table public.management_alert_events enable row level security;

create policy management_intelligence_settings_select
  on public.management_intelligence_settings for select
  using (public.has_permission('management_intelligence.view'));
create policy management_intelligence_settings_update
  on public.management_intelligence_settings for update
  using (public.has_permission('management_intelligence.manage_settings'))
  with check (public.has_permission('management_intelligence.manage_settings'));

create policy school_weekly_off_days_select
  on public.school_weekly_off_days for select
  using (public.has_permission('management_intelligence.view'));
create policy school_weekly_off_days_manage
  on public.school_weekly_off_days for all
  using (public.has_permission('management_intelligence.manage_settings'))
  with check (public.has_permission('management_intelligence.manage_settings'));

create policy academic_calendar_days_select
  on public.academic_calendar_days for select
  using (public.has_permission('management_intelligence.view'));
create policy academic_calendar_days_manage
  on public.academic_calendar_days for all
  using (public.has_permission('management_intelligence.manage_settings'))
  with check (public.has_permission('management_intelligence.manage_settings'));

create policy management_alerts_select
  on public.management_alerts for select
  using (public.has_permission('management_intelligence.view'));
create policy management_alerts_manage
  on public.management_alerts for all
  using (public.has_permission('management_intelligence.manage_alerts'))
  with check (public.has_permission('management_intelligence.manage_alerts'));

create policy management_alert_events_select
  on public.management_alert_events for select
  using (public.has_permission('management_intelligence.view'));
create policy management_alert_events_insert
  on public.management_alert_events for insert
  with check (public.has_permission('management_intelligence.manage_alerts'));

-- Explicit API privileges are independent from RLS on newer Supabase projects.
revoke all on table public.management_intelligence_settings from anon, authenticated;
revoke all on table public.school_weekly_off_days from anon, authenticated;
revoke all on table public.academic_calendar_days from anon, authenticated;
revoke all on table public.management_alerts from anon, authenticated;
revoke all on table public.management_alert_events from anon, authenticated;

grant select, update on table public.management_intelligence_settings to authenticated;
grant select, insert, update, delete on table public.school_weekly_off_days to authenticated;
grant select, insert, update, delete on table public.academic_calendar_days to authenticated;
grant select, insert, update, delete on table public.management_alerts to authenticated;
grant select, insert on table public.management_alert_events to authenticated;

comment on table public.management_intelligence_settings is
  'Typed thresholds for deterministic Management Intelligence rules.';
comment on table public.school_weekly_off_days is
  'Recurring weekly non-working days; Sunday is seeded and may be configured by management.';
comment on table public.academic_calendar_days is
  'Academic-year date overrides for holidays, closures, and exceptional working days.';
comment on column public.management_alerts.fingerprint is
  'Deterministic rule/entity/academic-period key used to update or reopen, never duplicate, a condition.';
