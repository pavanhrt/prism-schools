-- Phase 3 — Student Attendance
-- One row per student per calendar day. Marking rights go to the class
-- (homeroom) teacher for that section, not every subject teacher — see
-- is_class_teacher() in 0010_teacher_assignments.sql.

create table public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  section_id uuid not null references public.sections(id),
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'half_day')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint student_attendance_one_per_day unique (student_id, attendance_date)
);

create index student_attendance_class_section_date_idx
  on public.student_attendance (class_id, section_id, attendance_date);
create index student_attendance_student_idx
  on public.student_attendance (student_id, attendance_date);

create trigger student_attendance_touch
  before update on public.student_attendance
  for each row execute function public.touch_updated_at();

alter table public.student_attendance enable row level security;

-- No student/parent select policy yet — students has no auth.users
-- linkage until Phase 8 builds portal login, so "view own attendance"
-- isn't expressible as an RLS predicate today. Granting attendance.view
-- broadly to student/parent now would mean seeing everyone's attendance,
-- which is worse than not shipping the read at all.
create policy student_attendance_select on public.student_attendance
  for select using (public.has_permission('attendance.view'));

create policy student_attendance_insert on public.student_attendance
  for insert with check (
    public.is_admin()
    or (
      public.has_permission('attendance.mark')
      and public.is_class_teacher(class_id, section_id, academic_year_id)
    )
  );

create policy student_attendance_update on public.student_attendance
  for update using (
    public.is_admin()
    or (
      public.has_permission('attendance.edit')
      and public.is_class_teacher(class_id, section_id, academic_year_id)
    )
  );
