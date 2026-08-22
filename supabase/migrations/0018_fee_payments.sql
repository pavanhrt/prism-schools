-- Phase 5 — Payments: the fix for the legacy schema's ambiguous
-- fee_invoices.payment_id <-> fee_payments.invoice_id pair (blueprint §06).
-- One invoice -> many payments, one direction only. Append-only ledger:
-- a wrongly-entered payment is voided (status flip + reason), never
-- deleted or edited — the audit trail has to survive corrections.
--
-- razorpay_payment_id carries a plain UNIQUE constraint — Postgres allows
-- unlimited NULLs through a unique constraint, so manual payments (which
-- have none) are unaffected, while a duplicate webhook delivery for the
-- same Razorpay payment is rejected outright. This is the idempotency
-- guarantee blueprint §15 called for.

create sequence public.fee_receipt_seq start 1;

create or replace function public.next_receipt_no()
returns text
language plpgsql
as $$
declare
  prefix text;
  next_val bigint;
begin
  select receipt_prefix into prefix from public.school_settings where id = 1;
  next_val := nextval('public.fee_receipt_seq');
  return coalesce(prefix, 'REC-') || lpad(next_val::text, 5, '0');
end;
$$;


create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.fee_invoices(id),
  receipt_no text not null unique default public.next_receipt_no(),
  amount numeric(10, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_mode text not null
    check (payment_mode in ('cash', 'upi', 'bank_transfer', 'cheque', 'razorpay')),
  transaction_ref text,
  razorpay_order_id text,
  razorpay_payment_id text unique,
  razorpay_signature text,
  note text,
  status text not null default 'verified' check (status in ('verified', 'voided')),
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  void_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index fee_payments_invoice_idx on public.fee_payments (invoice_id);

-- Voiding is the only legitimate mutation on a payment row — a dedicated
-- function rather than a generic UPDATE, so "who can void, and does it
-- always leave a reason" is enforced in one place, not by RLS alone.
create or replace function public.void_fee_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('fees.refund') then
    raise exception 'Forbidden';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to void a payment.';
  end if;

  update public.fee_payments
    set status = 'voided', voided_at = now(), voided_by = auth.uid(), void_reason = p_reason
    where id = p_payment_id and status = 'verified';
end;
$$;


alter table public.fee_payments enable row level security;

create policy fee_payments_select on public.fee_payments
  for select using (public.has_permission('fees.view'));
create policy fee_payments_insert on public.fee_payments
  for insert with check (public.has_permission('fees.collect'));
-- No update policy: voiding goes through void_fee_payment() (security
-- definer, bypasses RLS internally after its own permission check), and
-- nothing else should ever touch a payment row after it's created.
