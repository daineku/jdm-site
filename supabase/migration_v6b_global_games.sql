-- ============================================================
-- MIGRATION V6B: Global Games
-- Tables: global_games, car_games
-- global_games = reusable named game entities (not per-car forms)
-- car_games    = many-to-many assignment to cars
-- Legacy 'racing_games' table is NOT touched.
-- Run in Supabase SQL Editor after migration_v6a_global_builds.sql
-- ============================================================

create table if not exists global_games (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  description      text,            -- short — shown on cards/lists
  page_description text,            -- long editorial intro for /game/[slug] page
  logo_url         text,
  seo_title        text,
  seo_description  text,
  og_image_url     text,
  sort_order       int  not null default 0,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists car_games (
  car_id   uuid not null references cars(id) on delete cascade,
  game_id  uuid not null references global_games(id) on delete cascade,
  sort_order int not null default 0,
  primary key (car_id, game_id)
);

alter table global_games disable row level security;
alter table car_games    disable row level security;

-- ROLLBACK:
-- drop table if exists car_games;
-- drop table if exists global_games;
