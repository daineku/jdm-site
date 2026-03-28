-- ============================================================
-- MIGRATION V2 — Run in Supabase SQL Editor
-- Safe to run on existing schema (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- 1. BRANDS
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  sort_order integer default 0,
  is_visible boolean default true,
  created_at timestamptz default now()
);

-- 2. Add columns to cars (models)
alter table cars add column if not exists brand_id uuid references brands(id) on delete set null;
alter table cars add column if not exists subtitle text;
alter table cars add column if not exists seo_title text;
alter table cars add column if not exists seo_description text;
alter table cars add column if not exists sort_order integer default 0;

-- 3. Add columns to gallery_photos
alter table gallery_photos add column if not exists caption text;
alter table gallery_photos add column if not exists alt_text text;
alter table gallery_photos add column if not exists home_sort_order integer default 0;
alter table gallery_photos add column if not exists is_visible boolean default true;
alter table gallery_photos add column if not exists width integer;
alter table gallery_photos add column if not exists height integer;

-- 4. MODEL BLOCKS
create table if not exists model_blocks (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade not null,
  block_type text not null,
  title text,
  sort_order integer default 0,
  is_visible boolean default true,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 5. Add to builds
alter table builds add column if not exists is_visible boolean default true;

-- 6. BUILD PARTS
create table if not exists build_parts (
  id uuid default gen_random_uuid() primary key,
  build_id uuid references builds(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  notes text
);

-- 7. Add to accessories
alter table accessories add column if not exists category text;
alter table accessories add column if not exists sort_order integer default 0;

-- 8. ACCESSORY <-> MODEL junction
create table if not exists accessory_models (
  id uuid default gen_random_uuid() primary key,
  accessory_id uuid references accessories(id) on delete cascade not null,
  car_id uuid references cars(id) on delete cascade not null,
  unique(accessory_id, car_id)
);

-- 9. Add to videos
alter table videos add column if not exists is_visible boolean default true;
alter table videos add column if not exists embed_type text default 'tiktok';
alter table videos add column if not exists embed_id text;

-- 10. Add to racing_games
alter table racing_games add column if not exists sort_order integer default 0;
alter table racing_games add column if not exists is_visible boolean default true;
alter table racing_games add column if not exists external_url text;

-- 11. Indexes
create index if not exists brands_slug_idx on brands(slug);
create index if not exists brands_sort_idx on brands(sort_order);
create index if not exists cars_brand_id_idx on cars(brand_id);
create index if not exists gallery_photos_home_sort_idx on gallery_photos(home_sort_order);
create index if not exists gallery_photos_visible_idx on gallery_photos(is_visible, show_on_home);
create index if not exists model_blocks_car_sort_idx on model_blocks(car_id, sort_order);
create index if not exists build_parts_build_id_idx on build_parts(build_id);
create index if not exists accessory_models_acc_idx on accessory_models(accessory_id);
create index if not exists accessory_models_car_idx on accessory_models(car_id);

-- 12. DISABLE RLS (single-owner site, security via secret URL)
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
-- UPDATE home_sort_order for existing photos
-- ============================================================
update gallery_photos set home_sort_order = sort_order where home_sort_order = 0 and sort_order > 0;

select 'Migration v2 complete' as status;
