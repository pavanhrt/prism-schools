-- Phase 9 — Public website
-- Contact fields the public Contact page needs — same "add columns in the
-- phase that needs them" approach as every prior school_settings ALTER.
alter table public.school_settings
  add column contact_email text,
  add column contact_phone text,
  add column address text;

-- school_settings has no secrets in this schema (Razorpay/SMTP credentials
-- are env vars, not DB columns — see blueprint §8), so it's safe to let
-- anonymous visitors read branding fields for the public site.

drop policy school_settings_select on public.school_settings;
create policy school_settings_select on public.school_settings
  for select using (true);

-- classes.name is what the public Academics page lists — not sensitive,
-- and useful for prospective parents browsing before enquiring.
drop policy classes_select on public.classes;
create policy classes_select on public.classes
  for select using (true);
