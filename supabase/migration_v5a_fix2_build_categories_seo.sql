-- ============================================================
-- MIGRATION V5A-FIX2: Build Categories — ensure SEO + page fields exist
-- Idempotent. ADD COLUMN IF NOT EXISTS only. No destructive changes.
-- Safe to run even if migration_v5a_build_categories.sql was already run.
-- Run in Supabase SQL Editor.
-- ============================================================

alter table build_categories
  add column if not exists seo_title        text,
  add column if not exists seo_description  text,
  add column if not exists og_image_url     text,
  add column if not exists is_published     boolean not null default false,
  add column if not exists page_description text;

-- ROLLBACK (only if you need to undo — these are all safe to keep):
-- alter table build_categories drop column if exists seo_title;
-- alter table build_categories drop column if exists seo_description;
-- alter table build_categories drop column if exists og_image_url;
-- alter table build_categories drop column if exists is_published;
-- alter table build_categories drop column if exists page_description;
