-- Migration v4: Fix RLS for public read access
-- Run this in Supabase SQL Editor if model pages return 404 or data is missing

-- Tables that need public read access (frontend fetches these with anon key)
alter table cars disable row level security;
alter table gallery_photos disable row level security;
alter table brands disable row level security;
alter table builds disable row level security;
alter table build_parts disable row level security;
alter table accessories disable row level security;
alter table videos disable row level security;
alter table racing_games disable row level security;
alter table model_blocks disable row level security;
alter table site_settings disable row level security;

-- This is a single-owner site with no user authentication.
-- RLS provides no benefit and causes 404s on published models when anon key is used.

select 'Migration v4 complete — RLS disabled on all tables' as status;
