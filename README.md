# DAINEKU

A premium JDM (Japanese Domestic Market) automotive archive site with an admin panel.

**Live:** daineku.com  
**Admin:** `daineku.com/<ADMIN_SECRET_PATH>`  
**Repo:** github.com/daineku/jdm-site

---

## What this is

An editorial photo archive for JDM car models. Not a car listing or database. The homepage is a hand-curated photo feed managed by the owner. Model pages show a photo gallery, description, builds, accessories, videos, game appearances, build style categories, wheel specs, fitment data, and aftermarket mods.

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

All are required unless marked optional. Set in Vercel and in `.env.local` for local dev.

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (server-only, admin writes)
R2_ACCOUNT_ID                   # Cloudflare account ID
R2_ACCESS_KEY_ID                # R2 API token access key
R2_SECRET_ACCESS_KEY            # R2 API token secret
R2_BUCKET_NAME=jdm-photos
R2_PUBLIC_URL=https://pub-xxx.r2.dev   # R2 public bucket URL (no trailing slash)
ADMIN_SECRET_PATH=admin...             # URL path and request header secret (>=32 chars)
NEXT_PUBLIC_SITE_URL=https://daineku.com  # Used by sitemap.ts (optional, defaults to daineku.com)
```

### Feature flag overrides (optional)

Feature flags in `lib/features.ts` default to `'off'`. To enable a v5 feature in production without a code deploy, set these env vars in Vercel:

```
FEATURE_BUILD_CATEGORIES_ADMIN=admin   # Build Categories in admin sidebar
FEATURE_PART_CATEGORIES_ADMIN=admin    # Part Categories in admin sidebar
FEATURE_MODEL_SPECS_TAB=admin          # Specs tab per model (wheel/tire/offset)
FEATURE_MODEL_FITMENT_TAB=admin        # Fitment tab per model (editorial stance)
FEATURE_MODEL_STYLE_TAB=admin          # Style tab per model (category assignment)
FEATURE_MODEL_MODS_TAB=admin           # Mods tab per model (aftermarket parts)
```

Values: `off` (default), `admin` (admin-only), `public` (all surfaces). Public sections on model pages render automatically whenever data exists — no flag required for public display.

---

## Database setup

Run migrations in order in the Supabase SQL Editor:

```
supabase/schema.sql                              # Initial schema
supabase/migration_v2_final.sql                  # Brands, model_blocks, build_parts
supabase/migration_v3_accessories.sql            # hidden_for_car_ids on accessories
supabase/migration_v4_fix_rls.sql                # Disables RLS — REQUIRED for public pages
supabase/migration_v5a_build_categories.sql      # build_categories + car_build_categories + 9 seeds
supabase/migration_v5a_fix_page_description.sql  # Adds page_description column (run after v5a)
supabase/migration_v5b_wheel_specs.sql           # car_wheel_specs (OEM vs aftermarket)
supabase/migration_v5c_part_categories.sql       # part_categories + car_aftermarket_parts
supabase/migration_v5d_fitment.sql               # car_fitment (editorial stance data)
```

**Rule:** Never edit a deployed migration. If a correction is needed, write a new migration file.

Insert the default site settings row if missing:

```sql
INSERT INTO site_settings (site_title, tiktok_url, youtube_url, instagram_url, nav_links)
VALUES ('DAINEKU', '', '', '', '[]'::jsonb)
ON CONFLICT DO NOTHING;
```

Post-migration smoke check:

```sql
SELECT count(*) FROM build_categories;       -- should be 9 (seeded)
SELECT count(*) FROM car_build_categories;
SELECT count(*) FROM car_wheel_specs;
SELECT count(*) FROM part_categories;
SELECT count(*) FROM car_aftermarket_parts;
SELECT count(*) FROM car_fitment;
```

---

## Build and deploy

```bash
npm run build          # production build (must pass with 0 errors)
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

Expected output: `13 passed, 0 failed`. Must pass before every deploy.

---

## Admin access

URL pattern: `https://yourdomain.com/<ADMIN_SECRET_PATH>`  
The path itself is the secret — it is also sent as the `x-admin-secret` header on all API calls.

No login form. Keep `ADMIN_SECRET_PATH` out of version control. Use a value of at least 32 characters.

---

## Admin structure

The admin panel is organized into two sidebar groups:

**Global** — entities that exist independently of any model:
- Site Settings
- Build Categories *(v5, `BUILD_CATEGORIES_ADMIN` flag)*
- Part Categories *(v5, `PART_CATEGORIES_ADMIN` flag)*

**Content** — curated site content:
- Models (with per-model tabs: Gallery, Builds, Videos, Games, Blocks, Info/SEO + v5 tabs)
- Homepage
- Accessories
- Brands

**Per-model v5 tabs** (shown when feature flags are `admin` or `public`):
- **Specs** — OEM vs Aftermarket wheel/tire/offset comparison table
- **Fitment** — Editorial stance/look data (style, height, camber, wheel guidance, popular options)
- **Style** — Build category assignment (checkboxes against global taxonomy)
- **Mods** — Aftermarket parts list, taxonomy-driven by part categories

---

## Services used

**Supabase** — PostgreSQL database + anon/service-role access. RLS is disabled on all tables (single-owner site, no public write access). If `SUPABASE_SERVICE_ROLE_KEY` is missing, a console warning is emitted on server start and admin writes fall back to anon key.

**Cloudflare R2** — Object storage for images. Two objects per photo: full size (max 2400px) and thumbnail (max 800px). R2 public access must be enabled on the `jdm-photos` bucket.

**Vercel** — Hosting and deployment. Model pages use `force-dynamic`. Image optimization via Next.js `/api/image` route.

---

## Further reading

See **HANDOFF.md** for:
- Full architecture and component map
- v5 content model and public render order
- Feature flag system
- Fragile areas and known constraints
- Failed approaches not to repeat
- AI agent working guide
