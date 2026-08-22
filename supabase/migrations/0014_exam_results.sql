-- Phase 4 — Exam Results, with the state machine the legacy schema never
-- had: marks entry is only possible while result_status = 'draft'; after
-- publish, any edit is trigger-logged to exam_result_audit automatically;
-- once locked, no edit is possible at all, for anyone.

create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks_theory numeric(5, 2),
  marks_practical numeric(5, 2),
  attendance_status text not null default 'present'
    check (attendance_status in ('present', 'absent', 'medical', 'late')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint exam_results_one_per_student unique (exam_schedule_id, student_id)
);

create index exam_results_exam_schedule_idx on public.exam_results (exam_schedule_id);

create trigger exam_results_touch
  before update on public.exam_results
  for each row execute function public.touch_updated_at();


create table public.exam_result_audit (
  id uuid primary key default gen_random_uuid(),
  exam_result_id uuid not null references public.exam_results(id) on delete cascade,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  before_marks_theory numeric(5, 2),
  before_marks_practical numeric(5, 2),
  after_marks_theory numeric(5, 2),
  after_marks_practical numeric(5, 2)
);

create index exam_result_audit_result_idx on public.exam_result_audit (exam_result_id);


-- Can this caller enter/edit marks for this exam schedule right now?
-- Requires both a teacher_assignments row for that class+subject in the
-- exam's own academic year, and the schedule still being in draft.
create or replace function public.can_enter_marks(p_exam_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_schedules es
    join public.exams e on e.id = es.exam_id
    join public.exam_terms t on t.id = e.term_id
    join public.teacher_assignments ta
      on ta.class_id = es.class_id
      and ta.subject_id = es.subject_id
      and ta.academic_year_id = t.academic_year_id
      and ta.teacher_id = auth.uid()
    where es.id = p_exam_schedule_id
      and es.result_status = 'draft'
  );
$$;

-- Trigger: blocks edits once locked, audits edits once published. Runs
-- regardless of who made the change — including an admin using is_admin()
-- to bypass the RLS scoping check — so the rule can't be worked around by
-- going through a different role.
create or replace function public.log_exam_result_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select result_status into v_status
  from public.exam_schedules where id = new.exam_schedule_id;

  if v_status = 'locked' then
    raise exception 'Results are locked for this exam schedule and cannot be modified.';
  end if;

  if v_status = 'published'
     and (old.marks_theory is distinct from new.marks_theory
          or old.marks_practical is distinct from new.marks_practical) then
    insert into public.exam_result_audit (
      exam_result_id, changed_by,
      before_marks_theory, before_marks_practical,
      after_marks_theory, after_marks_practical
    ) values (
      new.id, auth.uid(),
      old.marks_theory, old.marks_practical,
      new.marks_theory, new.marks_practical
    );
  end if;

  return new;
end;
$$;

create trigger exam_results_audit_trigger
  before update on public.exam_results
  for each row execute function public.log_exam_result_change();


-- Teacher-initiated: draft -> submitted. Nothing else moves through here.
create or replace function public.submit_results_for_review(p_exam_schedule_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_permission('exams.enter_marks') and public.can_enter_marks(p_exam_schedule_id)) then
    raise exception 'Forbidden';
  end if;
  update public.exam_schedules
    set result_status = 'submitted'
    where id = p_exam_schedule_id and result_status = 'draft';
end;
$$;

-- Admin-only: every other transition, and only the legal ones. This is
-- the single place the state machine's rules live — the app never issues
-- a raw UPDATE on result_status.
create or replace function public.advance_exam_result_status(
  p_exam_schedule_id uuid, p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if not public.has_permission('exams.publish') then
    raise exception 'Forbidden';
  end if;

  select result_status into v_current from public.exam_schedules where id = p_exam_schedule_id;

  if (v_current, p_new_status) not in (
    ('submitted', 'approved'), ('submitted', 'draft'),
    ('approved', 'published'), ('approved', 'draft'),
    ('published', 'locked')
  ) then
    raise exception 'Illegal result status transition: % -> %', v_current, p_new_status;
  end if;

  update public.exam_schedules set result_status = p_new_status where id = p_exam_schedule_id;
end;
$$;


alter table public.exam_results       enable row level security;
alter table public.exam_result_audit  enable row level security;

create policy exam_results_select on public.exam_results
  for select using (public.has_permission('exams.view'));
create policy exam_results_insert on public.exam_results
  for insert with check (
    public.is_admin()
    or (public.has_permission('exams.enter_marks') and public.can_enter_marks(exam_schedule_id))
  );
create policy exam_results_update on public.exam_results
  for update using (
    public.is_admin()
    or (public.has_permission('exams.enter_marks') and public.can_enter_marks(exam_schedule_id))
  );

create policy exam_result_audit_select on public.exam_result_audit
  for select using (public.has_permission('exams.view'));
