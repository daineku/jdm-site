-- ============================================================
-- MIGRATION V7C: Aftermarket Parts — product/affiliate fields
--
-- key_specs stored as jsonb array of {label, value} pairs:
--   [{"label": "Size", "value": "255/35/18"}, {"label": "Travel", "value": "80mm"}]
-- Max 8 pairs. All values are strings. No nesting.
-- Maps to schema.org Product additionalProperty for rich results.
--
-- Additive only. Safe to rerun.
-- ============================================================

alter table car_aftermarket_parts
  add column if not exists image_url     text,
  add column if not exists affiliate_url text,
  add column if not exists price_range   text,               -- editorial e.g. "$450–$600"
  add column if not exists key_specs     jsonb default '[]'::jsonb,
  add column if not exists availability  text                -- 'in_stock' | 'limited' | 'discontinued'
    check (availability in ('in_stock', 'limited', 'discontinued') or availability is null),
  add column if not exists is_featured   boolean not null default false;

-- ROLLBACK:
-- alter table car_aftermarket_parts drop column if exists image_url;
-- alter table car_aftermarket_parts drop column if exists affiliate_url;
-- alter table car_aftermarket_parts drop column if exists price_range;
-- alter table car_aftermarket_parts drop column if exists key_specs;
-- alter table car_aftermarket_parts drop column if exists availability;
-- alter table car_aftermarket_parts drop column if exists is_featured;
