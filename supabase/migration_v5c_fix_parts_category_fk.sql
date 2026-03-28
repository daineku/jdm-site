-- ============================================================
-- MIGRATION V5C-FIX: Add category_id FK to car_aftermarket_parts
--
-- ROOT CAUSE:
-- migration_v5c_part_categories.sql defined car_aftermarket_parts with
-- category_id uuid references part_categories(id), but the live DB already
-- had the table with a legacy `category text` column. CREATE TABLE IF NOT EXISTS
-- silently no-oped, so the FK was never added. PostgREST cannot resolve
-- .select('*, category:part_categories(...)') without a real FK.
--
-- SAFE: additive only. Legacy `category` text column is preserved.
-- Column name is `name` on car_aftermarket_parts — NOT `part_name`.
-- Backfill matches on part_categories.name (case-insensitive).
-- ============================================================

-- Step 1: Add the FK column if it does not already exist
alter table car_aftermarket_parts
  add column if not exists category_id uuid references part_categories(id) on delete set null;

-- Step 2: Backfill from legacy `category` text column (only if column exists)
-- Matches part_categories.name case-insensitively.
-- Rows with no match or no legacy category remain category_id = null (valid).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'car_aftermarket_parts' and column_name = 'category'
  ) then
    update car_aftermarket_parts p
    set category_id = pc.id
    from part_categories pc
    where lower(p.category) = lower(pc.name)
      and p.category_id is null;
  end if;
end $$;

-- VERIFICATION (run after applying):
-- 1. Confirm column + FK exist:
--    select column_name, data_type from information_schema.columns
--    where table_name = 'car_aftermarket_parts' order by ordinal_position;
--
-- 2. Confirm FK constraint:
--    select conname from pg_constraint
--    where conrelid = 'car_aftermarket_parts'::regclass and contype = 'f'
--    and conname ilike '%category%';
--
-- 3. Confirm PostgREST join works (run in Supabase SQL editor):
--    select p.id, p.name, c.name as category_name
--    from car_aftermarket_parts p
--    left join part_categories c on c.id = p.category_id
--    limit 5;
