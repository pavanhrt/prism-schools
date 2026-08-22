-- Phase 5 — Fee configuration: types + per-class-per-year structure.

create table public.fee_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  frequency text not null default 'monthly'
    check (frequency in ('monthly', 'quarterly', 'annually', 'one_time')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger fee_types_touch
  before update on public.fee_types
  for each row execute function public.touch_updated_at();


create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  class_id uuid not null references public.classes(id),
  fee_type_id uuid not null references public.fee_types(id),
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint fee_structures_unique unique (academic_year_id, class_id, fee_type_id)
);

create index fee_structures_year_class_idx on public.fee_structures (academic_year_id, class_id);

create trigger fee_structures_touch
  before update on public.fee_structures
  for each row execute function public.touch_updated_at();


-- invoice_prefix/receipt_prefix/expense_prefix didn't exist yet — same
-- "add settings columns in the phase that needs them" approach as
-- 0006_school_settings.sql.
alter table public.school_settings
  add column invoice_prefix text not null default 'INV-',
  add column receipt_prefix text not null default 'REC-',
  add column expense_prefix text not null default 'EXP-';


alter table public.fee_types      enable row level security;
alter table public.fee_structures enable row level security;

create policy fee_types_select on public.fee_types
  for select using (auth.role() = 'authenticated');
create policy fee_types_write on public.fee_types
  for all using (public.has_permission('fees.manage_structure'))
  with check (public.has_permission('fees.manage_structure'));

create policy fee_structures_select on public.fee_structures
  for select using (auth.role() = 'authenticated');
create policy fee_structures_write on public.fee_structures
  for all using (public.has_permission('fees.manage_structure'))
  with check (public.has_permission('fees.manage_structure'));
