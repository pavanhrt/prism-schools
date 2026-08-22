-- Phase 1 — Foundation
-- Ensures gen_random_uuid() is available for all subsequent migrations.
create extension if not exists "pgcrypto";

-- Shared trigger: stamps updated_at / updated_by on every UPDATE.
-- Attached per-table in later migrations rather than globally, so each
-- table opts in explicitly.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
