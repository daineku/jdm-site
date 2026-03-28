-- ============================================================
-- MIGRATION V8A: Global Parts Catalog
--
-- global_parts = true global catalog entity, NO car_id column.
-- The only car linkage is through model_parts (many-to-many).
--
-- car_aftermarket_parts is NOT touched — it remains as legacy.
-- The public switch to global_parts is Phase 2 (after data is populated).
--
-- PHASE 1 purpose: schema + admin CRUD + model assignment only.
-- Public Mods rendering continues to use car_aftermarket_parts until Phase 2.
-- ============================================================

create table if not exists global_parts (
  id               uuid primary key default gen_random_uuid(),
  part_category_id uuid references part_categories(id) on delete set null,
  title            text not null,
  brand_name       text,
  notes            text,                       -- editorial note
  image_url        text,
  affiliate_url    text,
  price_range      text,                       -- editorial e.g. "$450–$600"
  key_specs        jsonb default '[]'::jsonb,  -- [{label, value}] pairs, max 8
  availability     text
    check (availability in ('in_stock','limited','discontinued') or availability is null),
  is_featured      boolean not null default false,
  sort_order       int     not null default 0,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

-- model_parts: the only place a part connects to a car
create table if not exists model_parts (
  car_id  uuid not null references cars(id) on delete cascade,
  part_id uuid not null references global_parts(id) on delete cascade,
  primary key (car_id, part_id)
);

alter table global_parts  disable row level security;
alter table model_parts   disable row level security;

-- ROLLBACK:
-- drop table if exists model_parts;
-- drop table if exists global_parts;
