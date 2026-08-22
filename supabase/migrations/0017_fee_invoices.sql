-- Phase 5 — Invoices
-- Deliberately no total_amount drift risk: line items are inserted once,
-- atomically, with the invoice — there is no "edit invoice" path, only
-- "create a new invoice", so total_amount is safe to store at creation.
-- paid_amount and status are NOT stored anywhere here — see fee_payments
-- (0018) for why: they're derived from the payment ledger at read time.

create sequence public.fee_invoice_seq start 1;

create or replace function public.next_invoice_no()
returns text
language plpgsql
as $$
declare
  prefix text;
  next_val bigint;
begin
  select invoice_prefix into prefix from public.school_settings where id = 1;
  next_val := nextval('public.fee_invoice_seq');
  return coalesce(prefix, 'INV-') || lpad(next_val::text, 5, '0');
end;
$$;


create table public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  academic_year_id uuid not null references public.academic_years(id),
  invoice_no text not null unique default public.next_invoice_no(),
  due_date date not null,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index fee_invoices_student_idx on public.fee_invoices (student_id);
create index fee_invoices_year_idx on public.fee_invoices (academic_year_id);

create trigger fee_invoices_touch
  before update on public.fee_invoices
  for each row execute function public.touch_updated_at();


create table public.fee_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  fee_type_id uuid not null references public.fee_types(id),
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index fee_invoice_items_invoice_idx on public.fee_invoice_items (invoice_id);


alter table public.fee_invoices      enable row level security;
alter table public.fee_invoice_items enable row level security;

create policy fee_invoices_select on public.fee_invoices
  for select using (public.has_permission('fees.view'));
create policy fee_invoices_insert on public.fee_invoices
  for insert with check (public.has_permission('fees.create'));

create policy fee_invoice_items_select on public.fee_invoice_items
  for select using (public.has_permission('fees.view'));
create policy fee_invoice_items_insert on public.fee_invoice_items
  for insert with check (public.has_permission('fees.create'));
