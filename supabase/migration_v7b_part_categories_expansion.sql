-- ============================================================
-- MIGRATION V7B: Part Categories — expansion for page-bearing entities
-- Adds description, image, SEO fields to support /parts and /parts/[slug] pages.
-- Additive only. Safe to rerun.
-- ============================================================

alter table part_categories
  add column if not exists description      text,         -- short — shown in /parts listing cards
  add column if not exists page_description text,         -- editorial intro for /parts/[slug]
  add column if not exists image_url        text,         -- visual hero for listing + detail page
  add column if not exists seo_title        text,
  add column if not exists seo_description  text,
  add column if not exists og_image_url     text,         -- social/share OG override
  add column if not exists is_published     boolean not null default false;

-- ROLLBACK:
-- alter table part_categories drop column if exists description;
-- alter table part_categories drop column if exists page_description;
-- alter table part_categories drop column if exists image_url;
-- alter table part_categories drop column if exists seo_title;
-- alter table part_categories drop column if exists seo_description;
-- alter table part_categories drop column if exists og_image_url;
-- alter table part_categories drop column if exists is_published;
