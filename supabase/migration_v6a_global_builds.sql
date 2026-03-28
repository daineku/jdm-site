-- ============================================================
-- MIGRATION V6A: Global Builds
-- Tables: global_builds, car_builds
-- global_builds = reusable named build entities (not per-car forms)
-- car_builds    = many-to-many assignment to cars
-- Legacy 'builds' and 'build_parts' tables are NOT touched.
-- Run in Supabase SQL Editor after migration_v5e_settings_seo.sql
-- ============================================================

create table if not exists global_builds (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  description      text,            -- short — shown on cards/lists
  page_description text,            -- long editorial intro for /build/[slug] page
  logo_url         text,
  seo_title        text,
  seo_description  text,
  og_image_url     text,
  sort_order       int  not null default 0,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists car_builds (
  car_id    uuid not null references cars(id) on delete cascade,
  build_id  uuid not null references global_builds(id) on delete cascade,
  sort_order int not null default 0,
  primary key (car_id, build_id)
);

alter table global_builds disable row level security;
alter table car_builds    disable row level security;

-- ROLLBACK:
-- drop table if exists car_builds;
-- drop table if exists global_builds;
