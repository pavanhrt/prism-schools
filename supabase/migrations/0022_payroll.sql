-- Phase 6 — Payroll
-- The fix for the legacy schema's payrolls.status ('Paid'/'Unpaid'/
-- 'Generated' only, no approval chain): a real 5-state run lifecycle,
-- stricter than exam results — once a run passes 'reviewed', payroll_items
-- become fully immutable for EVERYONE, no admin override. "Controlled
-- corrections" means going through payroll_adjustments, which get folded
-- into the next run, not a direct edit with an audit trail.

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  month smallint not null check (month between 1 and 12),
  year smallint not null,
  status text not null default 'draft'
    check (status in ('draft', 'calculated', 'reviewed', 'approved', 'processed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint payroll_runs_month_year_unique unique (month, year)
);

create trigger payroll_runs_touch
  before update on public.payroll_runs
  for each row execute function public.touch_updated_at();


create table public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  basic_pay numeric(10, 2) not null default 0,
  allowances numeric(10, 2) not null default 0,
  deductions numeric(10, 2) not null default 0,
  bonus numeric(10, 2) not null default 0,
  leave_deduction numeric(10, 2) not null default 0,
  -- Always trigger-computed below — never trust a client-supplied value.
  net_salary numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint payroll_items_one_per_staff_per_run unique (payroll_run_id, staff_id)
);

create index payroll_items_run_idx on public.payroll_items (payroll_run_id);

create or replace function public.compute_net_salary()
returns trigger
language plpgsql
as $$
begin
  new.net_salary := new.basic_pay + new.allowances + new.bonus - new.deductions - new.leave_deduction;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger payroll_items_compute_net
  before insert or update on public.payroll_items
  for each row execute function public.compute_net_salary();


create table public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id),
  payroll_item_id uuid references public.payroll_items(id),
  amount numeric(10, 2) not null,  -- positive = owed to staff, negative = recovery
  reason text not null,
  applied_in_payroll_run_id uuid references public.payroll_runs(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index payroll_adjustments_staff_idx on public.payroll_adjustments (staff_id);
create index payroll_adjustments_unapplied_idx
  on public.payroll_adjustments (staff_id) where applied_in_payroll_run_id is null;


-- Single place the state machine's legal transitions live. Two
-- permission tiers, matching §10's RBAC matrix (accountant "processes",
-- school_admin "approves"):
--   draft->calculated, calculated->reviewed, and the send-backs to draft
--     all require payroll.process
--   reviewed->approved, approved->processed require payroll.approve
create or replace function public.advance_payroll_status(p_run_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
  v_required_permission text;
begin
  select status into v_current from public.payroll_runs where id = p_run_id;

  v_required_permission := case
    when (v_current, p_new_status) in (('draft', 'calculated'), ('calculated', 'reviewed')) then 'payroll.process'
    when (v_current, p_new_status) in (('calculated', 'draft'), ('reviewed', 'draft')) then 'payroll.process'
    when (v_current, p_new_status) in (('reviewed', 'approved'), ('approved', 'processed')) then 'payroll.approve'
    else null
  end;

  if v_required_permission is null then
    raise exception 'Illegal payroll status transition: % -> %', v_current, p_new_status;
  end if;

  if not public.has_permission(v_required_permission) then
    raise exception 'Forbidden';
  end if;

  update public.payroll_runs set status = p_new_status where id = p_run_id;
end;
$$;


alter table public.payroll_runs        enable row level security;
alter table public.payroll_items       enable row level security;
alter table public.payroll_adjustments enable row level security;

create policy payroll_runs_select on public.payroll_runs
  for select using (public.has_permission('payroll.view'));
create policy payroll_runs_insert on public.payroll_runs
  for insert with check (public.has_permission('payroll.process'));
-- No general UPDATE policy: status only ever changes via
-- advance_payroll_status() (security definer, bypasses RLS after its own
-- permission + legal-transition check).

create policy payroll_items_select on public.payroll_items
  for select using (
    public.has_permission('payroll.view')
    or staff_id in (select id from public.staff where user_id = auth.uid())
  );
-- Editable only while the parent run hasn't progressed past 'calculated' —
-- this is the "immutable once reviewed, for everyone" rule, enforced as
-- an RLS predicate rather than relying on app discipline.
create policy payroll_items_insert on public.payroll_items
  for insert with check (
    public.has_permission('payroll.process')
    and (select status from public.payroll_runs where id = payroll_run_id) in ('draft', 'calculated')
  );
create policy payroll_items_update on public.payroll_items
  for update using (
    public.has_permission('payroll.process')
    and (select status from public.payroll_runs where id = payroll_run_id) in ('draft', 'calculated')
  );

create policy payroll_adjustments_select on public.payroll_adjustments
  for select using (
    public.has_permission('payroll.view')
    or staff_id in (select id from public.staff where user_id = auth.uid())
  );
create policy payroll_adjustments_insert on public.payroll_adjustments
  for insert with check (public.has_permission('payroll.approve'));
-- Marking an adjustment as folded into a run is part of the calculation
-- step (payroll.process), not the approval step — the decision to create
-- the adjustment already required payroll.approve; applying it is
-- mechanical bookkeeping, and only ever sets applied_in_payroll_run_id.
create policy payroll_adjustments_update on public.payroll_adjustments
  for update using (public.has_permission('payroll.process'));
