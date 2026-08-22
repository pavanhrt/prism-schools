-- Phase 5 — Expenses

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger expense_categories_touch
  before update on public.expense_categories
  for each row execute function public.touch_updated_at();


create sequence public.expense_seq start 1;

create or replace function public.next_expense_no()
returns text
language plpgsql
as $$
declare
  prefix text;
  next_val bigint;
begin
  select expense_prefix into prefix from public.school_settings where id = 1;
  next_val := nextval('public.expense_seq');
  return coalesce(prefix, 'EXP-') || lpad(next_val::text, 5, '0');
end;
$$;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_no text not null unique default public.next_expense_no(),
  category_id uuid not null references public.expense_categories(id),
  amount numeric(10, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  description text,
  paid_to text,
  payment_mode text not null default 'cash'
    check (payment_mode in ('cash', 'upi', 'bank_transfer', 'cheque')),
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index expenses_category_idx on public.expenses (category_id);
create index expenses_date_idx on public.expenses (expense_date);

create trigger expenses_touch
  before update on public.expenses
  for each row execute function public.touch_updated_at();


alter table public.expense_categories enable row level security;
alter table public.expenses           enable row level security;

create policy expense_categories_select on public.expense_categories
  for select using (public.has_permission('expenses.view'));
create policy expense_categories_write on public.expense_categories
  for all using (public.has_permission('expenses.edit'))
  with check (public.has_permission('expenses.edit'));

create policy expenses_select on public.expenses
  for select using (public.has_permission('expenses.view'));
create policy expenses_insert on public.expenses
  for insert with check (public.has_permission('expenses.create'));
create policy expenses_update on public.expenses
  for update using (public.has_permission('expenses.edit'));
