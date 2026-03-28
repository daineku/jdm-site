-- ============================================================
-- MIGRATION V5D: Car Fitment
-- Table: car_fitment
-- Purpose: Editorial fitment and stance data (not technical specs)
-- One row per car (unique constraint on car_id)
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists car_fitment (
  id                   uuid primary key default gen_random_uuid(),
  car_id               uuid not null unique references cars(id) on delete cascade,

  -- Visual / editorial stance descriptors
  fitment_style        text,   -- e.g. 'flush' | 'poke' | 'stance' | 'tucked'
  ride_height          text,   -- e.g. 'slammed' | 'low' | 'daily' | 'stock'
  camber_look          text,   -- e.g. 'aggressive' | 'slight' | 'zero'

  -- Wheel guidance
  best_wheel_style     text,   -- e.g. 'mesh' | 'multi-spoke' | 'dish' | 'split-spoke'
  best_diameter        text,   -- e.g. '17"' | '18"' | '19"'

  -- What's actually on the car (observed / estimated)
  observed_rim_guess   text,

  -- Curated popular rim options for this car
  popular_rim_option_1 text,
  popular_rim_option_2 text,

  -- Editorial summary (supports **bold** / *italic* / paragraph formatting)
  editorial_summary    text,

  is_visible           boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table car_fitment disable row level security;

-- ROLLBACK:
-- drop table if exists car_fitment;
