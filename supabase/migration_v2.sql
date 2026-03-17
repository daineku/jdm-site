-- ============================================================
-- MIGRATION V2: Full production schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. BRANDS (new table)
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  sort_order integer default 0,
  is_visible boolean default true,
  created_at timestamptz default now()
);
create index if not exists brands_slug_idx on brands(slug);
create index if not exists brands_sort_idx on brands(sort_order);

-- 2. MODELS (rename from cars, add new fields)
-- We keep the "cars" table name for backward compat but add columns
alter table cars add column if not exists brand_id uuid references brands(id) on delete set null;
alter table cars add column if not exists subtitle text;
alter table cars add column if not exists seo_title text;
alter table cars add column if not exists seo_description text;
alter table cars add column if not exists sort_order integer default 0;
create index if not exists cars_brand_id_idx on cars(brand_id);

-- 3. GALLERY PHOTOS — add missing fields
alter table gallery_photos add column if not exists caption text;
alter table gallery_photos add column if not exists alt_text text;
alter table gallery_photos add column if not exists home_sort_order integer default 0;
alter table gallery_photos add column if not exists is_visible boolean default true;
alter table gallery_photos add column if not exists width integer;
alter table gallery_photos add column if not exists height integer;

-- 4. MODEL BLOCKS (new — block-based page sections)
create table if not exists model_blocks (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade not null,
  block_type text not null,  -- 'gallery'|'builds'|'accessories'|'videos'|'racing_games'|'rich_text'|'media'
  title text,
  sort_order integer default 0,
  is_visible boolean default true,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists model_blocks_car_id_idx on model_blocks(car_id);
create index if not exists model_blocks_sort_idx on model_blocks(car_id, sort_order);

-- 5. BUILDS — add visibility
alter table builds add column if not exists is_visible boolean default true;

-- 6. BUILD PARTS (normalize from array to table)
create table if not exists build_parts (
  id uuid default gen_random_uuid() primary key,
  build_id uuid references builds(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  notes text
);
create index if not exists build_parts_build_id_idx on build_parts(build_id);

-- 7. ACCESSORIES — add category, visibility, sort; replace car_ids array with junction
alter table accessories add column if not exists category text;
alter table accessories add column if not exists sort_order integer default 0;

create table if not exists accessory_models (
  id uuid default gen_random_uuid() primary key,
  accessory_id uuid references accessories(id) on delete cascade not null,
  car_id uuid references cars(id) on delete cascade not null,
  unique(accessory_id, car_id)
);
create index if not exists accessory_models_acc_idx on accessory_models(accessory_id);
create index if not exists accessory_models_car_idx on accessory_models(car_id);

-- 8. VIDEOS — add visibility, embed_type
alter table videos add column if not exists is_visible boolean default true;
alter table videos add column if not exists embed_type text default 'tiktok';
alter table videos add column if not exists embed_id text;

-- 9. RACING GAMES — add sort, visibility, link
alter table racing_games add column if not exists sort_order integer default 0;
alter table racing_games add column if not exists is_visible boolean default true;
alter table racing_games add column if not exists external_url text;

-- 10. SITE SETTINGS — make sure table exists with all fields
alter table site_settings add column if not exists nav_links jsonb default '[]'::jsonb;

-- ============================================================
-- DISABLE RLS (simplest approach for single-owner site)
-- ============================================================
alter table site_settings disable row level security;
alter table brands disable row level security;
alter table cars disable row level security;
alter table gallery_photos disable row level security;
alter table model_blocks disable row level security;
alter table builds disable row level security;
alter table build_parts disable row level security;
alter table accessories disable row level security;
alter table accessory_models disable row level security;
alter table videos disable row level security;
alter table racing_games disable row level security;

-- ============================================================
-- SEED default brand for migration (update brand_id manually after)
-- ============================================================
-- You can run: UPDATE cars SET brand_id = (SELECT id FROM brands WHERE slug = 'honda') WHERE brand = 'Honda';
