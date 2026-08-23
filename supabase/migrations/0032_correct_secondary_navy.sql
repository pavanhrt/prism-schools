-- Correct the Phase 5 secondary brand token after 0031 was applied with the
-- white surface token. Fresh installations already receive the corrected
-- 0031 default; this additive migration safely repairs existing installs.

alter table public.school_settings
  alter column secondary_color set default '#0B2A5B';

-- Preserve any operator customization made after 0031. Only replace the
-- exact just-seeded value that represented the mistaken default.
update public.school_settings
set secondary_color = '#0B2A5B'
where id = 1
  and secondary_color = '#FFFFFF';
