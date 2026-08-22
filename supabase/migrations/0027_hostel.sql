-- Phase 10 — Hostel

create table public.hostels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'boys' check (type in ('boys', 'girls', 'staff', 'common')),
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger hostels_touch
  before update on public.hostels
  for each row execute function public.touch_updated_at();


create table public.hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  room_no text not null,
  room_type text,
  capacity integer not null default 1 check (capacity > 0),
  cost_per_bed numeric(10, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint hostel_rooms_hostel_room_unique unique (hostel_id, room_no)
);

create trigger hostel_rooms_touch
  before update on public.hostel_rooms
  for each row execute function public.touch_updated_at();


create table public.hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hostel_rooms(id),
  student_id uuid not null references public.students(id),
  allocated_date date not null default current_date,
  vacated_date date,
  status text not null default 'active' check (status in ('active', 'vacated')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index hostel_allocations_room_idx on public.hostel_allocations (room_id);
-- One active bed at a time per student — a room's actual occupancy is
-- always `count(*) where status='active'`, derived at read time rather
-- than a stored counter on hostel_rooms (same reasoning as fee balances).
create unique index hostel_allocations_one_active_per_student
  on public.hostel_allocations (student_id)
  where status = 'active';


alter table public.hostels            enable row level security;
alter table public.hostel_rooms       enable row level security;
alter table public.hostel_allocations enable row level security;

create policy hostels_select on public.hostels
  for select using (auth.role() = 'authenticated');
create policy hostels_write on public.hostels
  for all using (public.has_permission('hostel.manage'))
  with check (public.has_permission('hostel.manage'));

create policy hostel_rooms_select on public.hostel_rooms
  for select using (auth.role() = 'authenticated');
create policy hostel_rooms_write on public.hostel_rooms
  for all using (public.has_permission('hostel.manage'))
  with check (public.has_permission('hostel.manage'));

create policy hostel_allocations_select on public.hostel_allocations
  for select using (public.has_permission('hostel.view') or public.is_own_student(student_id));
create policy hostel_allocations_insert on public.hostel_allocations
  for insert with check (public.has_permission('hostel.manage'));
create policy hostel_allocations_update on public.hostel_allocations
  for update using (public.has_permission('hostel.manage'));
