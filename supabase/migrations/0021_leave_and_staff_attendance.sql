-- Phase 6 — Leave requests + Staff attendance
-- Both are HR/admin-marked in this phase, not staff self-service — there
-- is no staff-facing portal yet (that's a future module, not Phase 8's
-- student/parent portal), so building a self-request flow now would have
-- no consuming UI. Staff can still read their own rows via the user_id
-- link, which is real and already in place from 0020.

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id),
  leave_type text not null check (leave_type in ('sick', 'casual', 'earned', 'maternity')),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint leave_requests_date_range check (end_date >= start_date)
);

create index leave_requests_staff_idx on public.leave_requests (staff_id);
create index leave_requests_status_idx on public.leave_requests (status);

create trigger leave_requests_touch
  before update on public.leave_requests
  for each row execute function public.touch_updated_at();

alter table public.leave_requests enable row level security;

create policy leave_requests_select on public.leave_requests
  for select using (
    public.has_permission('leave.view')
    or staff_id in (select id from public.staff where user_id = auth.uid())
  );
create policy leave_requests_insert on public.leave_requests
  for insert with check (public.has_permission('leave.create'));
create policy leave_requests_update on public.leave_requests
  for update using (public.has_permission('leave.approve'));


create table public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_date date not null,
  in_time time,
  out_time time,
  status text not null default 'present'
    check (status in ('present', 'absent', 'late', 'half_day', 'leave')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint staff_attendance_one_per_day unique (staff_id, attendance_date)
);

create index staff_attendance_date_idx on public.staff_attendance (attendance_date);

create trigger staff_attendance_touch
  before update on public.staff_attendance
  for each row execute function public.touch_updated_at();

alter table public.staff_attendance enable row level security;

create policy staff_attendance_select on public.staff_attendance
  for select using (
    public.has_permission('staff_attendance.view')
    or staff_id in (select id from public.staff where user_id = auth.uid())
  );
create policy staff_attendance_insert on public.staff_attendance
  for insert with check (public.has_permission('staff_attendance.mark'));
create policy staff_attendance_update on public.staff_attendance
  for update using (public.has_permission('staff_attendance.mark'));
