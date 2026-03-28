-- ============================================================
-- MIGRATION V5A-FIX: Add page_description to build_categories
-- Additive only — no destructive changes
-- Run AFTER migration_v5a_build_categories.sql
-- ============================================================

alter table build_categories
  add column if not exists page_description text;

-- page_description = long editorial intro displayed on the category page
-- description      = short summary displayed in cards/lists

-- ROLLBACK:
-- alter table build_categories drop column if exists page_description;
