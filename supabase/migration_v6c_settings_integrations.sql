-- ============================================================
-- MIGRATION V6C: Site Settings — Integrations
-- Adds GA4, Search Console verification, and favicon fields.
-- Only structured fields — no arbitrary script injection.
-- Run in Supabase SQL Editor after migration_v6b_global_games.sql
-- ============================================================

alter table site_settings
  add column if not exists ga4_measurement_id          text,   -- format: G-XXXXXXXXXX
  add column if not exists search_console_verification text,   -- content= value from HTML tag method
  add column if not exists favicon_url                 text;   -- HTTPS URL to favicon image

-- ROLLBACK:
-- alter table site_settings drop column if exists ga4_measurement_id;
-- alter table site_settings drop column if exists search_console_verification;
-- alter table site_settings drop column if exists favicon_url;
