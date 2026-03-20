# DAINEKU

A premium JDM (Japanese Domestic Market) automotive archive site with an admin panel.

**Live:** daineku.com  
**Admin:** `daineku.com/<ADMIN_SECRET_PATH>`  
**Repo:** github.com/daineku/jdm-site

---

## What this is

An editorial photo archive for JDM car models. Not a car listing or database. The homepage is a hand-curated photo feed managed by the owner. Model pages show a photo gallery, description, build specs, accessories, videos, and game appearances.

## What this is NOT

- Not a user-facing auth system
- Not a generic CMS
- Not a marketplace or listing site
- Not a multi-owner platform

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.3.6, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS **v4** + inline React styles |
| Database | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 (`jdm-photos` bucket) |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Font | Manrope (Google Fonts) |

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in all variables (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin panel: `http://localhost:3000/<your-ADMIN_SECRET_PATH>`

---

## Environment variables

All are required. Set in Vercel and in `.env.local` for local dev.

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (server-only)
R2_ACCOUNT_ID                   # Cloudflare account ID
R2_ACCESS_KEY_ID                # R2 API token access key
R2_SECRET_ACCESS_KEY            # R2 API token secret
R2_BUCKET_NAME=jdm-photos
R2_PUBLIC_URL=https://pub-xxx.r2.dev   # R2 public bucket URL (no trailing slash)
ADMIN_SECRET_PATH=admin...             # URL path and request header secret
```

---

## Database setup

The database is managed via Supabase. Run migrations in order in the Supabase SQL Editor:

```
supabase/schema.sql                  # Initial schema
supabase/migration_v2_final.sql      # Brands, model_blocks, build_parts
supabase/migration_v3_accessories.sql  # hidden_for_car_ids on accessories
supabase/migration_v4_fix_rls.sql    # Disables RLS — REQUIRED for public pages to work
```

Insert the default site settings row if missing:

```sql
INSERT INTO site_settings (site_title, tiktok_url, youtube_url, instagram_url, nav_links)
VALUES ('DAINEKU', '', '', '', '[]'::jsonb)
ON CONFLICT DO NOTHING;
```

---

## Build and deploy

```bash
npm run build          # production build
npm run start          # start production server locally

git add .
git commit -m "..."
git branch -M main
git push -u origin main --force
# Vercel auto-deploys on push to main
```

---

## Tests

```bash
npm run test:description   # 13-case unit test for description text formatter
```

Expected output: `13 passed, 0 failed`

---

## Admin access

URL pattern: `https://yourdomain.com/<ADMIN_SECRET_PATH>`  
The path itself is the secret — it is also sent as the `x-admin-secret` header on all API calls.

No login form. Keep `ADMIN_SECRET_PATH` out of version control.

---

## Services used

**Supabase** — PostgreSQL database + anon/service-role access. RLS is disabled on all tables (single-owner site, no public write access).

**Cloudflare R2** — Object storage for images. Two objects per photo: full size (max 2400px) and thumbnail (max 800px). R2 public access must be enabled on the `jdm-photos` bucket.

**Vercel** — Hosting and deployment. Model pages use `force-dynamic`. Image optimization via Next.js `/api/image` route.

---

## Further reading

See **HANDOFF.md** for:
- Full architecture and component map
- Fragile areas and known constraints
- Failed approaches not to repeat
- Safe development process
- AI agent working guide
