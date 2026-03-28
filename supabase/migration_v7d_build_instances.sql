-- ============================================================
-- MIGRATION V7D: Build Instances
--
-- car_build_instances = a specific build for a specific car,
--   tagged with a Build Category, with photos from that car's gallery.
-- build_instance_photos = which gallery photos belong to this build.
--   The first photo (sort_order ASC) is the featured image.
--
-- MINIMUM REQUIREMENTS (enforced in API, not just DB):
--   category_id must be non-null
--   at least one build_instance_photos row must exist
--   description must be non-null/non-empty
--   setup_summary must be non-null/non-empty
--
-- Additive only. Does not touch legacy 'builds' or 'build_parts' tables.
-- ============================================================

create table if not exists car_build_instances (
  id             uuid primary key default gen_random_uuid(),
  car_id         uuid not null references cars(id) on delete cascade,
  category_id    uuid not null references build_categories(id) on delete restrict,
  title          text not null,
  description    text not null,     -- build story/notes — required
  setup_summary  text not null,     -- quick config label — required, e.g. "Slammed + stretched + track"
  -- Build-specific wheel setup (separate from model-level OEM specs)
  wheel_brand    text,
  wheel_model    text,
  wheel_size_front text,
  wheel_size_rear  text,
  offset_front   text,
  offset_rear    text,
  tire_front     text,
  tire_rear      text,
  sort_order     int  not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists build_instance_photos (
  build_id   uuid not null references car_build_instances(id) on delete cascade,
  photo_id   uuid not null references gallery_photos(id) on delete cascade,
  sort_order int  not null default 0,
  primary key (build_id, photo_id)
);

alter table car_build_instances  disable row level security;
alter table build_instance_photos disable row level security;

-- ROLLBACK:
-- drop table if exists build_instance_photos;
-- drop table if exists car_build_instances;
