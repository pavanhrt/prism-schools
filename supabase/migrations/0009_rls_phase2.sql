-- Phase 2 — Row Level Security for admissions + students

alter table public.school_settings     enable row level security;
alter table public.admission_inquiries enable row level security;
alter table public.inquiry_followups   enable row level security;
alter table public.applications        enable row level security;
alter table public.students            enable row level security;
alter table public.student_enrollments enable row level security;

-- ---------------------------------------------------------------------
-- School settings: everyone signed in can read (prefixes, name are used
-- all over the UI); only settings.manage can write.
-- ---------------------------------------------------------------------
create policy school_settings_select on public.school_settings
  for select using (auth.role() = 'authenticated');
create policy school_settings_update on public.school_settings
  for update using (public.has_permission('settings.manage'));

-- ---------------------------------------------------------------------
-- Admissions / CRM
-- Note: the public enquiry form (Phase 9) will not go through these
-- policies at all — it writes via a Route Handler on the service-role
-- client, the same pattern login_attempts already uses, so an anonymous
-- visitor never needs a direct insert policy here.
-- ---------------------------------------------------------------------
create policy admission_inquiries_select on public.admission_inquiries
  for select using (public.has_permission('admissions.view'));
create policy admission_inquiries_insert on public.admission_inquiries
  for insert with check (public.has_permission('admissions.create'));
create policy admission_inquiries_update on public.admission_inquiries
  for update using (public.has_permission('admissions.edit'));

create policy inquiry_followups_select on public.inquiry_followups
  for select using (public.has_permission('admissions.view'));
create policy inquiry_followups_insert on public.inquiry_followups
  for insert with check (public.has_permission('admissions.edit'));

create policy applications_select on public.applications
  for select using (public.has_permission('admissions.view'));
create policy applications_insert on public.applications
  for insert with check (public.has_permission('admissions.create'));
create policy applications_update on public.applications
  for update using (public.has_permission('admissions.edit'));

-- ---------------------------------------------------------------------
-- Students
-- Deliberately no delete policy anywhere in Phase 2 — a student record is
-- never hard-deleted, only moved to an inactive/struck_off status.
-- ---------------------------------------------------------------------
create policy students_select on public.students
  for select using (public.has_permission('students.view'));
create policy students_insert on public.students
  for insert with check (public.has_permission('students.create'));
create policy students_update on public.students
  for update using (public.has_permission('students.edit'));

create policy student_enrollments_select on public.student_enrollments
  for select using (public.has_permission('students.view'));
create policy student_enrollments_insert on public.student_enrollments
  for insert with check (public.has_permission('students.edit'));
create policy student_enrollments_update on public.student_enrollments
  for update using (public.has_permission('students.edit'));
