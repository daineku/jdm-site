-- ============================================================
-- Migration v5: Build Categories, Rims/Fitment, Specs, Aftermarket Parts
-- Run this in Supabase SQL editor ONCE to extend the schema.
-- Safe to run on a live database — uses IF NOT EXISTS and ON CONFLICT DO NOTHING.
-- ============================================================

-- ── 1. build_categories (global lookup table) ────────────────
CREATE TABLE IF NOT EXISTS build_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  icon_ref    text,                 -- optional emoji or icon key, e.g. 'stance', 'track'
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS build_categories_sort ON build_categories (sort_order);

-- ── 2. car_build_categories (many‑to‑many junction) ─────────
CREATE TABLE IF NOT EXISTS car_build_categories (
  car_id      uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES build_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (car_id, category_id)
);

CREATE INDEX IF NOT EXISTS car_build_categories_car ON car_build_categories (car_id);

-- ── 3. car_fitment (one-to-one with cars) ───────────────────
CREATE TABLE IF NOT EXISTS car_fitment (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id              uuid NOT NULL UNIQUE REFERENCES cars(id) ON DELETE CASCADE,
  fitment_style       text,        -- 'Flush', 'Poke', 'Tuck', 'Stock'
  ride_height         text,        -- 'Slammed', 'Low', 'Moderate', 'Stock', 'Lifted'
  camber_look         text,        -- 'Aggressive', 'Street', 'Slight', 'None'
  best_wheel_style    text,        -- 'Mesh', 'Deep Dish', 'Multi-Spoke', etc.
  best_diameter       text,        -- '17"', '18"', etc.
  observed_rim_guess  text,        -- rim believed to be in the photos
  popular_rim_option_1 text,
  popular_rim_option_2 text,
  summary             text,        -- editorial paragraph
  is_visible          boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 4. car_specs (one-to-one with cars, OEM vs aftermarket) ─
CREATE TABLE IF NOT EXISTS car_specs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                    uuid NOT NULL UNIQUE REFERENCES cars(id) ON DELETE CASCADE,
  wheel_size_oem            text,   -- e.g. '15×6'
  wheel_size_aftermarket    text,
  wheel_diameter_oem        text,   -- e.g. '15"'
  wheel_diameter_aftermarket text,
  tire_size_oem             text,   -- e.g. '205/50R15'
  tire_size_aftermarket     text,
  offset_oem                text,   -- e.g. '+45'
  offset_aftermarket        text,
  notes                     text,
  is_visible                boolean NOT NULL DEFAULT true,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- ── 5. car_aftermarket_parts (many per car) ──────────────────
CREATE TABLE IF NOT EXISTS car_aftermarket_parts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id      uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  category    text,            -- 'Body Kit', 'Aero', 'Exhaust', 'Suspension', etc.
  brand       text,
  part_name   text NOT NULL,
  note        text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_hidden   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS car_aftermarket_parts_car ON car_aftermarket_parts (car_id, sort_order);

-- ── 6. Disable RLS on new tables (matches project policy) ───
ALTER TABLE build_categories      DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_build_categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_fitment           DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_specs             DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_aftermarket_parts DISABLE ROW LEVEL SECURITY;

-- ── 7. Seed a handful of default build categories ───────────
INSERT INTO build_categories (name, slug, description, sort_order) VALUES
  ('Stance',     'stance',     'Low ride height, aggressive fitment, street presence',            10),
  ('Track',      'track',      'Performance-focused build with aero, cooling, and safety mods',   20),
  ('Street',     'street',     'Daily-driver build with mild performance upgrades',               30),
  ('Show',       'show',       'Detail-oriented build built for car shows and exhibitions',       40),
  ('Drift',      'drift',      'Rear-wheel-drive setup tuned for controlled oversteer',           50),
  ('Time Attack','time-attack','Lightweight, aero-optimised circuit build',                       60),
  ('Restomod',   'restomod',   'Classic body with modern drivetrain or suspension upgrades',      70),
  ('OEM+',       'oem-plus',   'Factory-correct appearance with subtle quality upgrades',         80)
ON CONFLICT (slug) DO NOTHING;

-- ── Done ─────────────────────────────────────────────────────
SELECT 'Migration v5 complete — build_categories, car_fitment, car_specs, car_aftermarket_parts created' AS status;
