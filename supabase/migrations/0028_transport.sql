-- Phase 10 — Transport

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_no text not null unique,
  model text,
  driver_name text,
  driver_phone text,
  capacity integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger vehicles_touch
  before update on public.vehicles
  for each row execute function public.touch_updated_at();


create table public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  route_name text not null,
  vehicle_id uuid references public.vehicles(id),
  fare numeric(10, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger transport_routes_touch
  before update on public.transport_routes
  for each row execute function public.touch_updated_at();


create table public.transport_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.transport_routes(id) on delete cascade,
  stop_name text not null,
  sequence smallint not null default 0,
  pickup_time time,
  created_at timestamptz not null default now()
);

create index transport_stops_route_idx on public.transport_stops (route_id);


create table public.student_transport (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  route_id uuid not null references public.transport_routes(id),
  stop_id uuid references public.transport_stops(id),
  academic_year_id uuid not null references public.academic_years(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  constraint student_transport_one_active_per_year unique (student_id, academic_year_id)
);


alter table public.vehicles          enable row level security;
alter table public.transport_routes  enable row level security;
alter table public.transport_stops   enable row level security;
alter table public.student_transport enable row level security;

create policy vehicles_select on public.vehicles
  for select using (public.has_permission('transport.view'));
create policy vehicles_write on public.vehicles
  for all using (public.has_permission('transport.manage'))
  with check (public.has_permission('transport.manage'));

create policy transport_routes_select on public.transport_routes
  for select using (auth.role() = 'authenticated');
create policy transport_routes_write on public.transport_routes
  for all using (public.has_permission('transport.manage'))
  with check (public.has_permission('transport.manage'));

create policy transport_stops_select on public.transport_stops
  for select using (auth.role() = 'authenticated');
create policy transport_stops_write on public.transport_stops
  for all using (public.has_permission('transport.manage'))
  with check (public.has_permission('transport.manage'));

create policy student_transport_select on public.student_transport
  for select using (public.has_permission('transport.view') or public.is_own_student(student_id));
create policy student_transport_write on public.student_transport
  for all using (public.has_permission('transport.manage'))
  with check (public.has_permission('transport.manage'));
