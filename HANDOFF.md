# DAINEKU — System Handoff

JDM automotive archive site. Next.js 15 + Supabase + Cloudflare R2.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.3.6 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + inline styles |
| Database | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 (images) |
| Deployment | Vercel |
| Font | Manrope (Google Fonts) |

## Architecture

### Upload Flow
1. Admin selects file (JPEG, PNG, WEBP, or HEIC)
2. Client: if HEIC → heic2any converts to JPEG blob in browser
3. Client: Canvas API resizes to max 2400px, JPEG quality 0.88 → typically 0.5–3MB
4. POST compressed JPEG to `/api/admin/upload` (stays under Vercel's 4.5MB limit)
5. Server: sharp generates 800px thumbnail → both uploaded to R2
6. Server: saves DB record with url + thumb_url

**Critical:** Do NOT switch to presigned URL upload without configuring R2 CORS first.

### Model Routing
- Public pages use Supabase anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Only published models (`is_published = true`) appear publicly
- RLS must be **disabled** on all tables (see migration_v4_fix_rls.sql)
- Admin uses service role key (`SUPABASE_SERVICE_ROLE_KEY`) — bypasses RLS

### Admin
- URL: `yourdomain.com/[ADMIN_SECRET_PATH]`
- Auth: `x-admin-secret: ADMIN_SECRET_PATH` header on all API calls
- All admin API routes are under `/api/admin/`

### Homepage
- Curated photo feed — NOT a model directory
- Photos are manually selected per-photo with `show_on_home = true`
- Each photo has its own `caption` (shown on hover/mobile)
- All photos link to their parent model via `car.slug`
- Order is manual via `home_sort_order` — ascending = first shown
- Same model can appear multiple times via different photos

## Database Tables

| Table | Purpose |
|---|---|
| `site_settings` | Site title, social links, nav |
| `brands` | Car brands (Honda, Nissan, etc.) |
| `cars` | Models — main entity |
| `gallery_photos` | Photos per model, homepage feed |
| `builds` | Build specs per model |
| `build_parts` | Normalized parts list per build |
| `accessories` | Global accessories (shown on all models by default) |
| `videos` | TikTok embeds per model |
| `racing_games` | Games per model |
| `model_blocks` | Page layout blocks per model |

### Key fields

**cars:** `id, title, slug, is_published, brand_id, cover_image, description, subtitle, sort_order`

**gallery_photos:** `id, car_id, url, thumb_url, orientation, show_on_home, home_sort_order, sort_order, is_visible, caption`

**accessories:** global by default — `hidden_for_car_ids uuid[]` hides from specific models

## File Structure

```
app/
  [adminPath]/           Admin panel (protected by ADMIN_SECRET_PATH)
    AdminClient.tsx      Sidebar layout
    page.tsx             Auth check + render
    components/
      ui.tsx             Shared primitives (Toast, Toggle, Field, api(), useToast)
      ModelEditor.tsx    Models list + detail (Gallery/Builds/Videos/Games/Blocks/Info)
      HomepageTab.tsx    Homepage feed editor
      AccessoriesTab.tsx Global accessories manager
      BrandsTab.tsx      Brands CRUD
      SettingsTab.tsx    Site settings
  api/admin/             All admin API routes (require x-admin-secret header)
    upload/              POST multipart photo upload
    upload-url/          POST presigned URL generator (not used in current flow)
    photo-record/        POST create DB record (not used in current flow)
    cars/                CRUD models
    brands/              CRUD brands
    photos/              GET/PUT/DELETE photos
    builds/              CRUD builds
    videos/              CRUD videos
    games/               CRUD racing games
    blocks/              CRUD page blocks
    accessories/         CRUD accessories
    homepage/            GET/PUT/POST homepage feed
    settings/            GET/PUT site settings
    test/                GET diagnostic — shows which env vars are set
  api/
    photos/              Public paginated homepage photos
    brands/              Public brands list
    site-settings/       Public site settings
  cars/[slug]/
    page.tsx             Model page (force-dynamic, is_published filter)
    CarPageClient.tsx    Block renderer
  page.tsx               Homepage (MasonryGallery with brand filter)
components/
  Header.tsx             Nav + brands dropdown
  MasonryGallery.tsx     Infinite scroll photo grid
  SpeedometerLoader.tsx  Loading animation
lib/
  types.ts               All TypeScript types
  supabase.ts            supabase (anon) + supabaseAdmin (service role)
  data.ts                All public read queries (is_published enforced)
  r2.ts                  R2 upload/delete helpers
  adminAuth.ts           isAuthed() — checks x-admin-secret header
supabase/
  schema.sql             Initial schema v1
  migration_v2_final.sql v2: brands, model_blocks, build_parts, new columns
  migration_v3_accessories.sql v3: hidden_for_car_ids on accessories
  migration_v4_fix_rls.sql v4: disable RLS on all tables (CRITICAL for 404 fix)
```

## Known Constraints

1. **Vercel 4.5MB body limit** — solved by client-side canvas compression
2. **HEIC** — solved by heic2any (browser-only, no server dependency)
3. **Sharp + HEIC** — sharp on Vercel cannot process HEIC, so thumbnail generation is done from the already-compressed JPEG (which was converted from HEIC by the browser)
4. **R2 CORS** — if switching to presigned URL uploads, you must configure R2 CORS to allow browser PUT requests from your domain
5. **Single-owner site** — RLS is disabled on all tables for simplicity

## Supabase SQL to run (first deploy)

```sql
-- Run migration_v4_fix_rls.sql if model pages return 404
-- Run if site_settings row is missing:
INSERT INTO site_settings (site_title, tiktok_url, youtube_url, instagram_url, nav_links)
VALUES ('DAINEKU', '', '', '', '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- Run migration_v3_accessories.sql if accessories table doesn't have hidden_for_car_ids
```
