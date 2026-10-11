-- Migration v10a: studio Journal articles.
--
-- ADDITIVE ONLY. Creates one new table; no existing table, column, row or policy is
-- touched. Safe to re-run: every statement is guarded (IF NOT EXISTS / OR REPLACE /
-- pg_policies check), so running it twice changes nothing the second time.
--
-- Access model:
--   anon, authenticated  SELECT only, and RLS limits that to published rows whose
--                        publication time has passed. No insert/update/delete.
--   service_role         full access (the admin API, server-side only; bypasses RLS).
--
-- Before applying: run supabase/audit/security_audit.sql and keep its output as the
-- pre-change snapshot. Rollback (only if nothing has been published that must be kept):
--   drop table if exists public.studio_articles;
--   drop function if exists public.studio_articles_touch();

create table if not exists public.studio_articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  title           text not null,
  excerpt         text not null default '',
  body            text not null default '',
  category        text not null default '',
  cover_image_url text,
  cover_alt       text not null default '',
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  sort_order      integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint studio_articles_slug_key       unique (slug),
  constraint studio_articles_slug_format    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  constraint studio_articles_title_len      check (char_length(title) between 1 and 200),
  constraint studio_articles_excerpt_len    check (char_length(excerpt) <= 400),
  constraint studio_articles_body_len       check (char_length(body) <= 100000),
  constraint studio_articles_category_len   check (char_length(category) <= 60),
  constraint studio_articles_cover_alt_len  check (char_length(cover_alt) <= 300),
  constraint studio_articles_cover_https    check (cover_image_url is null or cover_image_url ~ '^https://'),
  constraint studio_articles_sort_order     check (sort_order between 0 and 9999),
  constraint studio_articles_published_date check (not is_published or published_at is not null)
);

comment on table public.studio_articles is 'DAINEKU studio Journal. Managed in the site admin (Journal tab). Public read = published rows only (RLS).';

create index if not exists studio_articles_published_idx
  on public.studio_articles (published_at desc) where is_published;

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.studio_articles_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace trigger studio_articles_touch
  before update on public.studio_articles
  for each row execute function public.studio_articles_touch();

-- RLS from creation. Supabase's default privileges grant ALL on new public tables to
-- anon/authenticated, so narrow the grants explicitly as well — RLS and grants are
-- independent layers, and a table should not rely on only one of them.
alter table public.studio_articles enable row level security;

revoke all on table public.studio_articles from anon, authenticated;
grant select on table public.studio_articles to anon, authenticated;
grant all on table public.studio_articles to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'studio_articles' and policyname = 'studio_articles_public_read'
  ) then
    create policy studio_articles_public_read on public.studio_articles
      for select to anon, authenticated
      using (is_published and published_at is not null and published_at <= now());
  end if;
end
$$;

select 'Migration v10a complete — studio_articles ready (RLS on, public read = published only)' as status;
