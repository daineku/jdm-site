-- ============================================================
-- MIGRATION V9A: Gallery Photos — original_url column
-- Stores the clean, unmodified original uploaded image.
-- Existing rows keep original_url = null (backward compatible).
-- url = watermarked public lightbox image (new uploads)
-- thumb_url = clean preview thumbnail (unchanged)
-- original_url = clean original, admin-only access
-- ============================================================

alter table gallery_photos
  add column if not exists original_url text null;

-- ROLLBACK:
-- alter table gallery_photos drop column if exists original_url;
