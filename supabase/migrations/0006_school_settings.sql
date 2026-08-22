-- Phase 2 — catches up a Phase 1 gap: the blueprint's own convention
-- ("IDs/invoice numbers use configurable prefixes from school_settings —
-- reuse those instead of hardcoding") needs a school_settings row to read
-- from before Students can generate admission numbers.
--
-- Deliberately minimal: only what Students needs right now. Branding, SMTP,
-- payment gateway, etc. get added by ALTER TABLE in the phases that
-- actually build those features (5, 7, 9) — no point designing those
-- columns before anything reads or writes them.
--
-- Singleton table: id is always 1, enforced by the check constraint, so
-- there is exactly one settings row for the one school (§28.6).

create table public.school_settings (
  id smallint primary key default 1,
  school_name text not null default 'Your School',
  student_id_prefix text not null default 'STU-',
  admission_prefix text not null default 'ADM-',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint school_settings_singleton check (id = 1)
);

create trigger school_settings_touch
  before update on public.school_settings
  for each row execute function public.touch_updated_at();

insert into public.school_settings (id) values (1);
