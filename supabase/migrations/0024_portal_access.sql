-- Phase 8 — Portal access
-- Every "deferred to Phase 8" note since 0008_students.sql gets resolved
-- here: a student can now have a login (students.user_id), a parent can
-- be linked to one or more children (guardians + student_guardians), and
-- every table the portal needs to read gets an ownership-based SELECT
-- policy on top of its existing staff-permission one — never a
-- replacement, an addition.

alter table public.students
  add column user_id uuid references auth.users(id);

create index students_user_id_idx on public.students (user_id);


create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  full_name text not null,
  relationship text not null check (relationship in ('father', 'mother', 'guardian')),
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index guardians_user_id_idx on public.guardians (user_id);

create trigger guardians_touch
  before update on public.guardians
  for each row execute function public.touch_updated_at();


create table public.student_guardians (
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (student_id, guardian_id)
);


-- Owns this student directly (is the student), or is a linked guardian.
create or replace function public.is_own_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students where id = p_student_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.student_guardians sg
    join public.guardians g on g.id = sg.guardian_id
    where sg.student_id = p_student_id and g.user_id = auth.uid()
  );
$$;

-- Any of the caller's own/linked children is currently enrolled in this
-- exact class+section — what homework visibility needs to check.
create or replace function public.is_own_class_section(p_class_id uuid, p_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_enrollments se
    where se.class_id = p_class_id
      and se.section_id = p_section_id
      and se.is_current
      and public.is_own_student(se.student_id)
  );
$$;


alter table public.guardians         enable row level security;
alter table public.student_guardians enable row level security;

create policy guardians_select on public.guardians
  for select using (public.has_permission('students.view') or user_id = auth.uid());
create policy guardians_write on public.guardians
  for all using (public.has_permission('students.edit'))
  with check (public.has_permission('students.edit'));

create policy student_guardians_select on public.student_guardians
  for select using (
    public.has_permission('students.view')
    or guardian_id in (select id from public.guardians where user_id = auth.uid())
  );
create policy student_guardians_write on public.student_guardians
  for all using (public.has_permission('students.edit'))
  with check (public.has_permission('students.edit'));


-- ---------------------------------------------------------------------
-- Additive ownership policies. Each of these DROPs and re-CREATEs the
-- table's existing SELECT policy with an extra `or` clause — the staff
-- permission check from the table's original migration still applies
-- unchanged, portal ownership is purely additional.
-- ---------------------------------------------------------------------

drop policy students_select on public.students;
create policy students_select on public.students
  for select using (public.has_permission('students.view') or user_id = auth.uid() or public.is_own_student(id));

drop policy student_enrollments_select on public.student_enrollments;
create policy student_enrollments_select on public.student_enrollments
  for select using (public.has_permission('students.view') or public.is_own_student(student_id));

drop policy student_attendance_select on public.student_attendance;
create policy student_attendance_select on public.student_attendance
  for select using (public.has_permission('attendance.view') or public.is_own_student(student_id));

-- Published (and locked) results only — draft/submitted/approved marks
-- stay invisible to the portal even for the student's own record, same
-- as the state machine already enforces for staff.
drop policy exam_results_select on public.exam_results;
create policy exam_results_select on public.exam_results
  for select using (
    public.has_permission('exams.view')
    or (
      public.is_own_student(student_id)
      and (select result_status from public.exam_schedules where id = exam_schedule_id) in ('published', 'locked')
    )
  );

drop policy fee_invoices_select on public.fee_invoices;
create policy fee_invoices_select on public.fee_invoices
  for select using (public.has_permission('fees.view') or public.is_own_student(student_id));

drop policy fee_invoice_items_select on public.fee_invoice_items;
create policy fee_invoice_items_select on public.fee_invoice_items
  for select using (
    public.has_permission('fees.view')
    or exists (
      select 1 from public.fee_invoices fi
      where fi.id = invoice_id and public.is_own_student(fi.student_id)
    )
  );

drop policy fee_payments_select on public.fee_payments;
create policy fee_payments_select on public.fee_payments
  for select using (
    public.has_permission('fees.view')
    or exists (
      select 1 from public.fee_invoices fi
      where fi.id = invoice_id and public.is_own_student(fi.student_id)
    )
  );

drop policy homework_select on public.homework;
create policy homework_select on public.homework
  for select using (public.has_permission('homework.view') or public.is_own_class_section(class_id, section_id));


-- Lets a students.edit holder link an existing auth account to a student
-- or guardian record by email, without exposing auth.users generally.
-- Deliberately separate from Phase 1's find_user_id_by_email (gated on
-- roles.manage) — this is account linking, not RBAC role assignment.
create or replace function public.find_auth_user_id_for_linking(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  if not public.has_permission('students.edit') then
    raise exception 'Forbidden';
  end if;

  select id into found_id from auth.users where email = lookup_email limit 1;
  return found_id;
end;
$$;
