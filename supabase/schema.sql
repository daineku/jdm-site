-- Site Settings
create table site_settings (
  id uuid default gen_random_uuid() primary key,
  site_title text not null default 'JDM BUILDS',
  logo_url text,
  tiktok_url text default '',
  youtube_url text default '',
  instagram_url text default '',
  nav_links jsonb default '[{"label":"Builds","href":"/builds"},{"label":"About","href":"/about"}]'::jsonb,
  updated_at timestamptz default now()
);

-- Insert default row
insert into site_settings (site_title) values ('JDM BUILDS');

-- Cars
create table cars (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  description text,
  brand text,
  cover_image text,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- Gallery Photos
create table gallery_photos (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade,
  url text not null,
  thumb_url text,
  orientation text check (orientation in ('vertical','horizontal')) default 'horizontal',
  sort_order integer default 0,
  show_on_home boolean default false,
  created_at timestamptz default now()
);

-- Builds
create table builds (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade,
  title text not null,
  description text,
  parts text[] default '{}',
  sort_order integer default 0
);

-- Accessories
create table accessories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  buy_url text,
  store text check (store in ('amazon','ebay','jegs','other')) default 'amazon',
  car_ids uuid[] default '{}',
  is_active boolean default true
);

-- Videos
create table videos (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade,
  tiktok_url text not null,
  title text,
  sort_order integer default 0
);

-- Racing Games
create table racing_games (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade,
  game_title text not null,
  game_logo_url text,
  description text
);

-- Indexes
create index on gallery_photos(car_id);
create index on gallery_photos(show_on_home);
create index on builds(car_id);
create index on videos(car_id);
create index on cars(slug);
create index on cars(brand);

-- RLS (Row Level Security) - public read, no write without auth
alter table site_settings enable row level security;
alter table cars enable row level security;
alter table gallery_photos enable row level security;
alter table builds enable row level security;
alter table accessories enable row level security;
alter table videos enable row level security;
alter table racing_games enable row level security;

-- Public read policies
create policy "Public read site_settings" on site_settings for select using (true);
create policy "Public read published cars" on cars for select using (is_published = true);
create policy "Public read gallery_photos" on gallery_photos for select using (true);
create policy "Public read builds" on builds for select using (true);
create policy "Public read accessories" on accessories for select using (is_active = true);
create policy "Public read videos" on videos for select using (true);
create policy "Public read racing_games" on racing_games for select using (true);
