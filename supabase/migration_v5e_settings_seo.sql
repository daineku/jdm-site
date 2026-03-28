-- ============================================================
-- MIGRATION V5E: Site Settings — SEO content defaults
-- Adds three new columns to site_settings.
-- These are SEO CONTENT fields managed by admin.
-- The canonical base URL lives in NEXT_PUBLIC_SITE_URL env var, not here.
-- Run in Supabase SQL Editor after migration_v5d_fitment.sql
-- ============================================================

alter table site_settings
  add column if not exists default_seo_description text,
  add column if not exists default_og_image         text;

-- Note: canonical_base_url is intentionally NOT stored here.
-- Use NEXT_PUBLIC_SITE_URL env var for all URL/domain concerns.
-- Keeping URL config in env prevents domain confusion across deployments.

-- ROLLBACK:
-- alter table site_settings drop column if exists default_seo_description;
-- alter table site_settings drop column if exists default_og_image;
