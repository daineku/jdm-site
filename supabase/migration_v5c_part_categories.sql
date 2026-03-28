-- ============================================================
-- MIGRATION V5C: Part Categories + Car Aftermarket Parts
-- Tables: part_categories, car_aftermarket_parts
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists part_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  icon_ref   text,          -- icon identifier for future UI
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists car_aftermarket_parts (
  id          uuid primary key default gen_random_uuid(),
  car_id      uuid not null references cars(id) on delete cascade,
  category_id uuid references part_categories(id) on delete set null,
  name        text not null,
  brand_name  text,
  notes       text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table part_categories      disable row level security;
alter table car_aftermarket_parts disable row level security;

-- ROLLBACK:
-- drop table if exists car_aftermarket_parts;
-- drop table if exists part_categories;
