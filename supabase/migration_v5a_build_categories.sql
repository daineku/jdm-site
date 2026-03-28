-- ============================================================
-- MIGRATION V5A: Build Categories
-- Tables: build_categories, car_build_categories
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists build_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  seo_title    text,
  seo_description text,
  og_image_url text,
  icon_ref     text,          -- icon identifier (not a URL)
  sort_order   int  not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists car_build_categories (
  car_id      uuid not null references cars(id) on delete cascade,
  category_id uuid not null references build_categories(id) on delete cascade,
  primary key (car_id, category_id)
);

alter table build_categories    disable row level security;
alter table car_build_categories disable row level security;

-- ── Canonical category seeds ──────────────────────────────────────────────────
-- is_published defaults to false — enable per-category after content is added.
-- ON CONFLICT DO NOTHING makes this re-runnable safely.
insert into build_categories (name, slug, sort_order) values
  ('OEM+',            'oem-plus',         10),
  ('Clean JDM',       'clean-jdm',        20),
  ('Street Stance',   'street-stance',    30),
  ('Show Stance',     'show-stance',      40),
  ('Track-Inspired',  'track-inspired',   50),
  ('Time Attack Style','time-attack-style',60),
  ('Drift Build',     'drift-build',      70),
  ('Bosozoku Style',  'bosozoku-style',   80),
  ('VIP Style',       'vip-style',        90)
on conflict (slug) do nothing;

-- ROLLBACK:
-- drop table if exists car_build_categories;
-- drop table if exists build_categories;
