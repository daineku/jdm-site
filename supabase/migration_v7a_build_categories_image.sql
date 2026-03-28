-- ============================================================
-- MIGRATION V7A: Build Categories — add visual image field
-- 
-- Semantic distinction:
--   icon_ref     = icon/symbol identifier for future icon-based UI (not a URL)
--   image_url    = visual hero/listing image shown on /builds listing + /builds/[slug]
--   og_image_url = social/share OG override (already exists from v5a-fix2)
--
-- Additive only. Safe to rerun.
-- ============================================================

alter table build_categories
  add column if not exists image_url text;   -- visual hero/listing image (distinct from og_image_url)

-- OG fallback: og_image_url → image_url → settings.default_og_image → []
-- image_url is the visual identity. og_image_url is the social override.

-- ROLLBACK:
-- alter table build_categories drop column if exists image_url;
