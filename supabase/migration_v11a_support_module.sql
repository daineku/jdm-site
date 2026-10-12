-- Migration v11a: Support module (Patreon) configuration on site_settings.
--
-- ADDITIVE ONLY. Adds nullable/defaulted columns to the existing single-row site_settings
-- table; no row, policy or other table is touched. Re-runnable (IF NOT EXISTS / guarded
-- constraints). Until this runs, the site treats the module as disabled and the admin's
-- Support section stays read-only — nothing else is affected.
--
-- Access: unchanged. These columns hold public, non-secret presentation settings and are read
-- with the same grants as the rest of site_settings; writes go through the admin API with the
-- service-role key.
--
-- Rollback (loses only this configuration):
--   alter table public.site_settings
--     drop column if exists support_enabled, drop column if exists support_url,
--     drop column if exists support_title, drop column if exists support_body,
--     drop column if exists support_cta, drop column if exists support_image_url,
--     drop column if exists support_image_alt, drop column if exists support_project,
--     drop column if exists support_placement;

alter table public.site_settings
  add column if not exists support_enabled   boolean not null default false,
  add column if not exists support_url       text,            -- https://www.patreon.com/<creator>
  add column if not exists support_title     text,            -- optional; module default when empty
  add column if not exists support_body      text,            -- optional; what supporters are funding
  add column if not exists support_cta       text,            -- optional; button label
  add column if not exists support_image_url text,            -- optional; HTTPS, uploaded via the admin
  add column if not exists support_image_alt text,
  add column if not exists support_project   text,            -- optional; project slug (lib/projects.ts)
  add column if not exists support_placement text not null default 'project';  -- 'project' | 'home'

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'site_settings_support_url_patreon') then
    alter table public.site_settings add constraint site_settings_support_url_patreon
      check (support_url is null or support_url ~ '^https://(www\.)?patreon\.com/[A-Za-z0-9_./-]{1,120}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_support_placement') then
    alter table public.site_settings add constraint site_settings_support_placement
      check (support_placement in ('project', 'home'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_support_lengths') then
    alter table public.site_settings add constraint site_settings_support_lengths
      check (char_length(coalesce(support_title, '')) <= 120 and char_length(coalesce(support_body, '')) <= 400
         and char_length(coalesce(support_cta, '')) <= 40 and char_length(coalesce(support_image_alt, '')) <= 200
         and char_length(coalesce(support_project, '')) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_support_image_https') then
    alter table public.site_settings add constraint site_settings_support_image_https
      check (support_image_url is null or support_image_url ~ '^https://');
  end if;
end
$$;

comment on column public.site_settings.support_enabled is 'Support module (Patreon): shown on the site only when true and support_url is a patreon.com page.';

select 'Migration v11a complete — site_settings carries the Support module columns (disabled by default)' as status;
