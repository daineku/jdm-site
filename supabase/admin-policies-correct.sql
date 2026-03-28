-- Drop existing read-only policies and replace with full access
-- Run this in Supabase SQL Editor

alter table site_settings disable row level security;
alter table cars disable row level security;
alter table gallery_photos disable row level security;
alter table builds disable row level security;
alter table accessories disable row level security;
alter table videos disable row level security;
alter table racing_games disable row level security;
