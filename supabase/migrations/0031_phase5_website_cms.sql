-- PRISM website Phase 5 — single-school website configuration/CMS.
--
-- WHY: public marketing content must be editable without a code deploy, while
-- remaining completely separate from operational records such as classes and
-- enrollments. This deliberately extends the existing id = 1 singleton; it
-- does not introduce a school/tenant dimension.

alter table public.school_settings
  add column short_name text,
  add column tagline text not null default 'A Modern Legacy of Learning',
  add column description text,
  add column logo_url text,
  add column favicon_url text,
  add column primary_color text not null default '#0B1F3A',
  add column secondary_color text not null default '#FFFFFF',
  add column accent_color text not null default '#D4AF37',
  add column hero_eyebrow text not null default 'PRISM SCHOOLS',
  add column hero_tagline text not null default 'A Modern Legacy of Learning',
  add column hero_title text not null default 'Where Learning Meets the Future',
  add column hero_description text not null default 'We go beyond textbooks — empowering students with AI, robotics, technology, creativity and real-world experiences to build the skills of tomorrow.',
  add column hero_primary_cta_label text not null default 'Explore Academics',
  add column hero_primary_cta_url text not null default '/academics',
  add column hero_secondary_cta_label text not null default 'Begin Admissions',
  add column hero_secondary_cta_url text not null default '/admissions',
  add column website_url text,
  add column address_line text,
  add column city text,
  add column district text,
  add column state text,
  add column country text,
  add column postal_code text,
  add column google_maps_url text,
  add column facebook_url text,
  add column instagram_url text,
  add column youtube_url text,
  add column linkedin_url text,
  add column seo_title text,
  add column seo_description text,
  add column og_image_url text;

-- Upgrade only the original scaffold placeholder; never overwrite a school
-- name an operator has already configured. Copying address into the new,
-- structured field preserves rather than resets the existing value.
update public.school_settings
set school_name = case when school_name = 'Your School' then 'PRISM SCHOOLS' else school_name end,
    short_name = coalesce(short_name, 'PRISM'),
    address_line = coalesce(address_line, address)
where id = 1;

alter table public.school_settings alter column school_name set default 'PRISM SCHOOLS';

create table public.website_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  level text,
  headline text,
  short_description text,
  description text,
  icon text,
  image_url text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description text,
  icon text,
  visual_type text,
  visual_asset_url text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_features (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 1000),
  icon text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index website_programs_public_order_idx
  on public.website_programs (display_order, title) where is_active;
create index website_services_public_order_idx
  on public.website_services (display_order, title) where is_active;
create index website_features_public_order_idx
  on public.website_features (display_order, title) where is_active;

create trigger website_programs_touch before update on public.website_programs
  for each row execute function public.touch_updated_at();
create trigger website_services_touch before update on public.website_services
  for each row execute function public.touch_updated_at();
create trigger website_features_touch before update on public.website_features
  for each row execute function public.touch_updated_at();

alter table public.website_programs enable row level security;
alter table public.website_services enable row level security;
alter table public.website_features enable row level security;

-- Anonymous/public callers see only published marketing rows. Authorized
-- editors may also read inactive rows so the CMS can manage drafts.
create policy website_programs_select on public.website_programs for select
  using (is_active or public.has_permission('website_settings.read'));
create policy website_services_select on public.website_services for select
  using (is_active or public.has_permission('website_settings.read'));
create policy website_features_select on public.website_features for select
  using (is_active or public.has_permission('website_settings.read'));

create policy website_programs_write on public.website_programs for all
  using (public.has_permission('website_settings.manage'))
  with check (public.has_permission('website_settings.manage'));
create policy website_services_write on public.website_services for all
  using (public.has_permission('website_settings.manage'))
  with check (public.has_permission('website_settings.manage'));
create policy website_features_write on public.website_features for all
  using (public.has_permission('website_settings.manage'))
  with check (public.has_permission('website_settings.manage'));

-- Direct row updates remain restricted to the existing operational-settings
-- permission. RLS is row-scoped, not column-scoped, so allowing the CMS
-- permission here would also allow direct API edits to admission/invoice/etc.
-- prefixes. CMS-only writes instead use the allowlisted function below.
drop policy school_settings_update on public.school_settings;
create policy school_settings_update on public.school_settings for update
  using (public.has_permission('settings.manage'))
  with check (id = 1 and public.has_permission('settings.manage'));

insert into public.permissions (key, module, description) values
  ('website_settings.read', 'settings', 'View inactive website configuration records in the admin CMS'),
  ('website_settings.manage', 'settings', 'Manage public website configuration and marketing content')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('super_admin', 'school_admin')
  and p.key in ('website_settings.read', 'website_settings.manage')
on conflict do nothing;

-- Anonymous visitors need public website facts, not operational prefixes or
-- audit metadata. Column grants provide the boundary that row-level policies
-- cannot express. Authenticated callers retain the existing full-row SELECT,
-- still subject to the singleton SELECT policy.
revoke select on table public.school_settings from public, anon;
grant select on table public.school_settings to authenticated;
grant select (
  id, school_name, short_name, tagline, description, logo_url, favicon_url,
  primary_color, secondary_color, accent_color, hero_eyebrow, hero_tagline,
  hero_title, hero_description, hero_primary_cta_label, hero_primary_cta_url,
  hero_secondary_cta_label, hero_secondary_cta_url, contact_email,
  contact_phone, website_url, address, address_line, city, district, state,
  country, postal_code, google_maps_url, facebook_url, instagram_url,
  youtube_url, linkedin_url, seo_title, seo_description, og_image_url
) on public.school_settings to anon;

-- A security-definer function is necessary because the CMS permission is
-- intentionally narrower than settings.manage. It checks the dedicated
-- permission, rejects unknown keys, and updates only public website columns.
create or replace function public.update_website_settings(p_settings jsonb)
returns public.school_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.school_settings;
  allowed_keys constant text[] := array[
    'school_name', 'short_name', 'tagline', 'description', 'logo_url',
    'favicon_url', 'primary_color', 'secondary_color', 'accent_color',
    'hero_eyebrow', 'hero_tagline', 'hero_title', 'hero_description',
    'hero_primary_cta_label', 'hero_primary_cta_url',
    'hero_secondary_cta_label', 'hero_secondary_cta_url', 'contact_email',
    'contact_phone', 'website_url', 'address_line', 'city', 'district',
    'state', 'country', 'postal_code', 'google_maps_url', 'facebook_url',
    'instagram_url', 'youtube_url', 'linkedin_url', 'seo_title',
    'seo_description', 'og_image_url'
  ];
begin
  if not public.has_permission('website_settings.manage') then
    raise exception 'Forbidden';
  end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'object' then
    raise exception 'Website settings payload must be an object';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_settings) as supplied(key)
    where not (supplied.key = any (allowed_keys))
  ) then
    raise exception 'Website settings payload contains unsupported fields';
  end if;

  update public.school_settings set
    school_name = case when p_settings ? 'school_name' then p_settings ->> 'school_name' else school_name end,
    short_name = case when p_settings ? 'short_name' then p_settings ->> 'short_name' else short_name end,
    tagline = case when p_settings ? 'tagline' then p_settings ->> 'tagline' else tagline end,
    description = case when p_settings ? 'description' then p_settings ->> 'description' else description end,
    logo_url = case when p_settings ? 'logo_url' then p_settings ->> 'logo_url' else logo_url end,
    favicon_url = case when p_settings ? 'favicon_url' then p_settings ->> 'favicon_url' else favicon_url end,
    primary_color = case when p_settings ? 'primary_color' then p_settings ->> 'primary_color' else primary_color end,
    secondary_color = case when p_settings ? 'secondary_color' then p_settings ->> 'secondary_color' else secondary_color end,
    accent_color = case when p_settings ? 'accent_color' then p_settings ->> 'accent_color' else accent_color end,
    hero_eyebrow = case when p_settings ? 'hero_eyebrow' then p_settings ->> 'hero_eyebrow' else hero_eyebrow end,
    hero_tagline = case when p_settings ? 'hero_tagline' then p_settings ->> 'hero_tagline' else hero_tagline end,
    hero_title = case when p_settings ? 'hero_title' then p_settings ->> 'hero_title' else hero_title end,
    hero_description = case when p_settings ? 'hero_description' then p_settings ->> 'hero_description' else hero_description end,
    hero_primary_cta_label = case when p_settings ? 'hero_primary_cta_label' then p_settings ->> 'hero_primary_cta_label' else hero_primary_cta_label end,
    hero_primary_cta_url = case when p_settings ? 'hero_primary_cta_url' then p_settings ->> 'hero_primary_cta_url' else hero_primary_cta_url end,
    hero_secondary_cta_label = case when p_settings ? 'hero_secondary_cta_label' then p_settings ->> 'hero_secondary_cta_label' else hero_secondary_cta_label end,
    hero_secondary_cta_url = case when p_settings ? 'hero_secondary_cta_url' then p_settings ->> 'hero_secondary_cta_url' else hero_secondary_cta_url end,
    contact_email = case when p_settings ? 'contact_email' then p_settings ->> 'contact_email' else contact_email end,
    contact_phone = case when p_settings ? 'contact_phone' then p_settings ->> 'contact_phone' else contact_phone end,
    website_url = case when p_settings ? 'website_url' then p_settings ->> 'website_url' else website_url end,
    address_line = case when p_settings ? 'address_line' then p_settings ->> 'address_line' else address_line end,
    city = case when p_settings ? 'city' then p_settings ->> 'city' else city end,
    district = case when p_settings ? 'district' then p_settings ->> 'district' else district end,
    state = case when p_settings ? 'state' then p_settings ->> 'state' else state end,
    country = case when p_settings ? 'country' then p_settings ->> 'country' else country end,
    postal_code = case when p_settings ? 'postal_code' then p_settings ->> 'postal_code' else postal_code end,
    google_maps_url = case when p_settings ? 'google_maps_url' then p_settings ->> 'google_maps_url' else google_maps_url end,
    facebook_url = case when p_settings ? 'facebook_url' then p_settings ->> 'facebook_url' else facebook_url end,
    instagram_url = case when p_settings ? 'instagram_url' then p_settings ->> 'instagram_url' else instagram_url end,
    youtube_url = case when p_settings ? 'youtube_url' then p_settings ->> 'youtube_url' else youtube_url end,
    linkedin_url = case when p_settings ? 'linkedin_url' then p_settings ->> 'linkedin_url' else linkedin_url end,
    seo_title = case when p_settings ? 'seo_title' then p_settings ->> 'seo_title' else seo_title end,
    seo_description = case when p_settings ? 'seo_description' then p_settings ->> 'seo_description' else seo_description end,
    og_image_url = case when p_settings ? 'og_image_url' then p_settings ->> 'og_image_url' else og_image_url end,
    updated_by = auth.uid()
  where id = 1
  returning * into result;
  return result;
end;
$$;

revoke execute on function public.update_website_settings(jsonb) from public, anon;
grant execute on function public.update_website_settings(jsonb) to authenticated;

insert into public.website_programs
  (title, slug, level, short_description, display_order) values
  ('Pre-Primary', 'pre-primary', 'Early Years', 'A welcoming beginning shaped by curiosity, communication, movement, play and discovery.', 10),
  ('Primary School', 'primary-school', 'Primary', 'Strong foundations grow through connected learning, creative expression and early technology awareness.', 20),
  ('Secondary School', 'secondary-school', 'Secondary', 'Advanced academics are paired with the thinking and leadership capabilities learners need for what comes next.', 30)
on conflict (slug) do nothing;

insert into public.website_services
  (title, slug, short_description, visual_type, display_order) values
  ('AI & Technology', 'ai-and-technology', 'Students explore artificial intelligence, digital tools, coding and emerging technologies through practical learning experiences.', 'network', 10),
  ('Robotics & Makers', 'robotics-and-makers', 'Students turn ideas into working creations by designing, building and experimenting with robotics and technology.', 'mechanical', 20),
  ('Creative Thinking', 'creative-thinking', 'We encourage students to question, imagine, experiment and create solutions instead of simply memorizing answers.', 'creative', 30),
  ('Real-World Skills', 'real-world-skills', 'Students apply classroom knowledge to projects, challenges and practical situations that prepare them for the real world.', 'systems', 40)
on conflict (slug) do nothing;

insert into public.website_features (title, description, display_order) values
  ('Future Ready', 'Students develop skills aligned with a rapidly changing world.', 10),
  ('Technology Integrated', 'Technology becomes a learning tool rather than just another subject.', 20),
  ('Learning by Doing', 'Students experience concepts through projects and experimentation.', 30),
  ('Creative Thinking', 'Questions, ideas and original solutions are encouraged.', 40),
  ('Strong Academics', 'Future-focused learning starts with strong academic foundations.', 50),
  ('Leadership', 'Students develop confidence, communication and leadership skills.', 60)
on conflict (title) do nothing;
