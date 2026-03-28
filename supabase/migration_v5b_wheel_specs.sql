-- ============================================================
-- MIGRATION V5B: Car Wheel Specs
-- Table: car_wheel_specs
-- Purpose: OEM vs Aftermarket wheel, tire, and offset comparison
-- One row per car (unique constraint on car_id)
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists car_wheel_specs (
  id                    uuid primary key default gen_random_uuid(),
  car_id                uuid not null unique references cars(id) on delete cascade,

  -- OEM configuration
  oem_wheel_size_front  text,   -- e.g. "16x6.5"
  oem_wheel_size_rear   text,
  oem_offset_front      text,   -- e.g. "+45"
  oem_offset_rear       text,
  oem_tire_front        text,   -- e.g. "205/55R16"
  oem_tire_rear         text,
  oem_notes             text,

  -- Aftermarket / current configuration
  am_wheel_brand        text,
  am_wheel_model        text,
  am_wheel_size_front   text,
  am_wheel_size_rear    text,
  am_offset_front       text,
  am_offset_rear        text,
  am_tire_front         text,
  am_tire_rear          text,
  am_notes              text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table car_wheel_specs disable row level security;

-- ROLLBACK:
-- drop table if exists car_wheel_specs;
