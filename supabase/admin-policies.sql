-- Allow all operations from server (service role bypasses RLS automatically)
-- But we need write policies for the anon key used in admin API routes
-- Since admin routes check x-admin-secret header server-side, we use service role key for writes

-- Add write policies (admin uses supabase with service role on server)
create policy "Allow all for service role" on cars for all using (true) with check (true);
create policy "Allow all for service role" on gallery_photos for all using (true) with check (true);
create policy "Allow all for service role" on builds for all using (true) with check (true);
create policy "Allow all for service role" on accessories for all using (true) with check (true);
create policy "Allow all for service role" on videos for all using (true) with check (true);
create policy "Allow all for service role" on racing_games for all using (true) with check (true);
create policy "Allow all for service role" on site_settings for all using (true) with check (true);
