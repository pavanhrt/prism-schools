-- Fix: touch_updated_at() (0001_extensions.sql) unconditionally sets
-- new.updated_by := auth.uid(), but roles_touch and profiles_touch
-- (0003_rbac.sql) were wired up on tables that never got an updated_by
-- column — every other table with this trigger has one. Any UPDATE on
-- roles or profiles fails with "record new has no field updated_by"
-- until this is added.

alter table public.roles
  add column updated_by uuid references auth.users(id);

alter table public.profiles
  add column updated_by uuid references auth.users(id);
