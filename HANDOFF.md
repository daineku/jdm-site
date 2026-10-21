# DAINEKU — Development Handoff

**Code is the source of truth. When this document conflicts with actual files, the files win.**  
Read this fully before touching any code. It encodes hard-earned lessons.

> **v10 (studio redesign):** `/` is now the DAINEKU studio site (Real-Time Simulation & Spatial Design).
> The JDM photo feed that used to be the homepage lives at **`/archive`** — same components, same API,
> same admin curation. Everything below that says "homepage feed" now means the archive feed.
> See **Section 23** for the studio architecture.

---

## Source of Truth — Key Files

When verifying behavior, these are the files that matter most:

| File | Controls |
|---|---|
| `app/cars/[slug]/CarPageClient.tsx` | Model page render order (10 sections), gallery, description, v5 blocks |
| `lib/renderDescription.tsx` | Description text formatter (bold, italic, paragraphs) |
| `components/PhotoGrid.tsx` | Archive (ex-homepage) masonry cards, memoization, auto-cycle, image stability |
| `components/MasonryGallery.tsx` | Infinite scroll, batching, fetch lock, ordering |
| `app/[adminPath]/components/ModelEditor.tsx` | Admin model CRUD, per-model tab router, upload pipeline |
| `lib/data.ts` | All public DB queries (enforces `is_published`, degrades gracefully) |
| `lib/types.ts` | All TypeScript types |
| `lib/features.ts` | Feature flag system — defaults + ENV override |
| `lib/validation/` | Zod schemas for all admin API payloads |
| `app/globals.css` | Tailwind v4 init, all custom CSS classes |
| `supabase/migration_v4_fix_rls.sql` | **Disables RLS — required for public pages** |

---

## 1. Project Overview

**DAINEKU** is a premium JDM automotive archive site. It is an editorial photo experience, not a car database.

**Homepage:** A curated photo feed. The owner manually selects individual photos to appear. Same model can appear multiple times via different photos. Each photo has its own caption. Cards link to their model page. NOT a model directory. NOT auto-generated.

**Model pages:** One page per car model. Content renders in a strict canonical order — see Section 5.

**Admin:** Internal CMS at `yourdomain.com/[ADMIN_SECRET_PATH]`. Manages models, photos, homepage feed, brands, accessories, site settings, and all v5 content (categories, specs, fitment, mods).

---

## 2. Tech Stack

| Layer | Detail |
|---|---|
| Framework | Next.js 15.3.6, App Router, `force-dynamic` on model pages |
| Language | TypeScript |
| Styling | Tailwind CSS **v4** (`@import "tailwindcss"` in globals.css) + inline styles |
| Database | Supabase (PostgreSQL), RLS disabled |
| Storage | Cloudflare R2 (`jdm-photos` bucket) |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Font | Manrope (Google Fonts, loaded in `app/layout.tsx`) |
| Image processing | Client: heic2any + Canvas resize. Server: sharp (thumbnail) |
| Validation | Zod — all admin API routes validate via `safeParse` before touching DB |

**Critical Tailwind v4 note:** `globals.css` line 3 must be `@import "tailwindcss"`. Changing to v3 `@tailwind base/components/utilities` silently kills ALL `sm:`, `md:`, `lg:` responsive classes across the entire site.

---

## 3. Project Structure

```
app/
  page.tsx                    Studio homepage (components/studio/*)
  archive/page.tsx            JDM feed (ex-homepage) — brand chips + MasonryGallery
  layout.tsx                  Root layout — fonts, Header
  globals.css                 Tailwind v4 init + all custom CSS
  sitemap.ts                  Sitemap — uses NEXT_PUBLIC_SITE_URL env var
  cars/[slug]/
    page.tsx                  Model page server component — fetches all 10 data sources
    loading.tsx               Static neutral skeleton during server fetch
    CarPageClient.tsx         Client renderer — 10-section canonical render order
  [adminPath]/
    page.tsx                  Auth check → AdminClient
    AdminClient.tsx           Sidebar layout — Global / Content groups
    components/
      ModelEditor.tsx         Models CRUD + per-model tab router (imports all tab files)
      HomepageTab.tsx         Homepage feed curation, Save Order
      AccessoriesTab.tsx      Global accessories
      BrandsTab.tsx           Brands CRUD
      BuildCategoriesTab.tsx  v5: Build categories global CRUD (feature-flagged)
      PartCategoriesTab.tsx   v5: Part categories global CRUD (feature-flagged)
      SettingsTab.tsx         Site settings
      ui.tsx                  Shared primitives: s, Field, Toggle, Toast, api(), useToast
      tabs/
        ModelGalleryTab.tsx   Photos, upload pipeline, infinite scroll
        ModelBuildsTab.tsx    Build specs + parts list
        ModelVideosTab.tsx    TikTok embed links
        ModelGamesTab.tsx     Racing game appearances
        ModelBlocksTab.tsx    Page layout block order
        ModelWheelSpecsTab.tsx  v5: OEM vs Aftermarket wheel/tire/offset form
        ModelFitmentTab.tsx     v5: Editorial stance/look data form
        ModelStyleTab.tsx       v5: Build category assignment (toggle per category)
        ModelModsTab.tsx        v5: Aftermarket parts list, taxonomy-driven
  api/
    photos/route.ts           Public: paginated homepage photos
    brands/route.ts           Public: brands list
    site-settings/route.ts    Public: site settings
  api/admin/                  All require x-admin-secret header + Zod validation
    upload/route.ts           POST multipart → sharp → R2 → DB
    cars/route.ts             CRUD models
    photos/route.ts           CRUD gallery photos
    builds/route.ts           CRUD builds + parts
    videos/route.ts           CRUD videos
    games/route.ts            CRUD games
    blocks/route.ts           CRUD page layout blocks
    homepage/route.ts         Feed + ordering
    accessories/route.ts      Global accessories
    brands/route.ts           Brands CRUD
    settings/route.ts         Site settings
    build-categories/route.ts v5: Build categories CRUD
    car-categories/route.ts   v5: Per-model category assignment (GET/POST/DELETE)
    wheel-specs/route.ts      v5: Wheel specs upsert (GET/PUT)
    fitment/route.ts          v5: Fitment upsert (GET/PUT)
    part-categories/route.ts  v5: Part categories CRUD
    car-aftermarket-parts/route.ts  v5: Per-model parts CRUD

components/
  PhotoGrid.tsx               Memoized masonry card renderer (homepage only)
  MasonryGallery.tsx          Infinite scroll wrapper
  Header.tsx                  Studio header — fixed nav, mobile menu, scroll-spy (no DB nav_links)
  Footer.tsx                  Studio footer — wordmark, nav, socials, archive link
  studio/                     Studio homepage sections, design system (studio.css), copy (content.ts)

lib/
  renderDescription.tsx       Description text formatter — safe, no dangerouslySetInnerHTML
  renderDescription.test.ts   Unit tests (13 cases)
  types.ts                    All TypeScript types (including v5: BuildCategory, CarWheelSpecs,
                              CarFitment, PartCategory, AftermarketPart)
  features.ts                 Feature flag system — three states, ENV override
  seo.ts                      SEO cascading fallback utilities
  supabase.ts                 supabase (anon) + supabaseAdmin (service role)
  data.ts                     Public read queries (is_published enforced, graceful degradation)
  r2.ts                       R2 upload/delete helpers
  adminAuth.ts                isAuthed() — secret check + in-memory rate limiting
  validation/
    shared.ts                 safeSlug, safeImageUrl, safeSocialUrl, safeTikTokUrl
    cars.ts                   CarCreateSchema, CarUpdateSchema, CarDeleteSchema
    settings.ts               SiteSettingsUpdateSchema
    build-categories.ts       BuildCategoryCreateSchema, BuildCategoryUpdateSchema
    wheel-specs.ts            CarWheelSpecsUpsertSchema
    fitment.ts                CarFitmentUpsertSchema
    part-categories.ts        PartCategoryCreateSchema, PartCategoryUpdateSchema
    car-aftermarket-parts.ts  AftermarketPartCreateSchema, AftermarketPartUpdateSchema

supabase/
  schema.sql                              Initial schema
  migration_v2_final.sql                  Brands, model_blocks, build_parts
  migration_v3_accessories.sql            hidden_for_car_ids
  migration_v4_fix_rls.sql                CRITICAL: disables RLS on all tables
  migration_v5a_build_categories.sql      build_categories + car_build_categories + 9 seeds
  migration_v5a_fix_page_description.sql  Adds page_description column to build_categories
  migration_v5b_wheel_specs.sql           car_wheel_specs (OEM + aftermarket fields)
  migration_v5c_part_categories.sql       part_categories + car_aftermarket_parts
  migration_v5d_fitment.sql               car_fitment (editorial stance data)
```

---

## 4. Database Schema

### Core tables (v1–v4)

**`site_settings`** — Single row. `site_title`, `logo_url`, social URLs, `nav_links` (JSONB).

**`cars`** — `id, title, slug, is_published, brand_id, cover_image, description, subtitle, sort_order, seo_title, seo_description`. `is_published=true` required for public access.

**`gallery_photos`** — `id, car_id, url, thumb_url, orientation, show_on_home, home_sort_order, sort_order, is_visible, caption, alt_text, width, height`.

**`model_blocks`** — Controls block order on model pages. If empty, `DEFAULT_BLOCK_ORDER` applies.

**`accessories`** — Global by default. `hidden_for_car_ids uuid[]` excludes specific models.

**`builds` + `build_parts`** — Per-model build specs with parts list.

**`videos`, `racing_games`** — Per-model, `is_visible` controlled.

### v5 tables

**`build_categories`** — Full content entities for editorial style classification.
- `name, slug, description` (short — cards/lists), `page_description` (long — category page intro)
- `seo_title, seo_description, og_image_url, icon_ref, sort_order, is_published`
- 9 canonical categories seeded: OEM+, Clean JDM, Street Stance, Show Stance, Track-Inspired, Time Attack Style, Drift Build, Bosozoku Style, VIP Style

**`car_build_categories`** — Many-to-many join. `(car_id, category_id)` primary key.

**`car_wheel_specs`** — One row per car (unique on `car_id`). OEM side: `oem_wheel_size_front/rear, oem_offset_front/rear, oem_tire_front/rear, oem_notes`. Aftermarket side: `am_wheel_brand, am_wheel_model, am_wheel_size_front/rear, am_offset_front/rear, am_tire_front/rear, am_notes`.

**`car_fitment`** — One row per car (unique on `car_id`). Editorial stance data: `fitment_style, ride_height, camber_look, best_wheel_style, best_diameter, observed_rim_guess, popular_rim_option_1, popular_rim_option_2, editorial_summary, is_visible`.

**`part_categories`** — Global taxonomy for aftermarket parts. `name, slug, icon_ref, sort_order, is_active`. `icon_ref` is an identifier string for future icon-based (NFS-style) filter UI — do not build that UI yet, only the data model.

**`car_aftermarket_parts`** — Per-model parts list. `car_id, category_id` (FK to `part_categories`, not free text), `name, brand_name, notes, sort_order`.

---

## 5. Model Page — Canonical Content Order

**This order is locked. Do not reorder. The comment in CarPageClient.tsx is authoritative.**

```
1.  Gallery              renderBlock('gallery') — returns null if no photos
2.  Description          model.description — explicit, not via blocks
3.  Builds               renderBlock via activeBlocks
4.  Accessories          renderBlock via activeBlocks
5.  Videos               renderBlock via activeBlocks
6.  Racing Games         renderBlock via activeBlocks
7.  Build Style          categories.length > 0 — tag chips, sorted by sort_order
8.  Specs                wheelSpecs && has any populated field — OEM vs AM table
9.  Fitment              fitment && has any data && is_visible — editorial stance
10. Mods                 parts.length > 0 — grouped by part category
```

Steps 1–6 go through the `renderBlock` system or the explicit `activeBlocks` loop. Steps 7–10 are explicit render blocks appended after the loop. All return nothing if data is absent or empty — no empty wrappers, no placeholders.

The 10 data sources are fetched in a single `Promise.all` in `app/cars/[slug]/page.tsx`. All public read functions in `lib/data.ts` catch errors and return `null` or `[]` — they never throw.

---

## 6. Feature Flag System

Flags live in `lib/features.ts`. Three states:

| State | Admin visible | API active | Public rendered |
|---|---|---|---|
| `'off'` | No | No | No |
| `'admin'` | Yes | Yes | No |
| `'public'` | Yes | Yes | Yes |

**ENV override:** Set `FEATURE_<KEY>=admin` (or `public` or `off`) in Vercel environment variables to change state without a code deploy. The key format is `FEATURE_` + the flag name in uppercase.

**Three-surface rule:** Before moving any flag to `'public'`, all three surfaces must be working: admin tab, API route, public renderer. Public sections (7–10 in the render order) render automatically whenever data exists regardless of flag state — the flag controls only the admin tab visibility.

**Current flag defaults (all `'off'`):**

```
BUILD_CATEGORIES_ADMIN   — Build Categories section in admin sidebar
PART_CATEGORIES_ADMIN    — Part Categories section in admin sidebar
MODEL_SPECS_TAB          — Specs tab per model
MODEL_FITMENT_TAB        — Fitment tab per model
MODEL_STYLE_TAB          — Style tab per model
MODEL_MODS_TAB           — Mods tab per model
CATEGORY_PAGES           — Future: /category/[slug] public pages
BRAND_PAGES              — Future: /brand/[slug] public pages
GA4_TRACKING             — Future: GA4 measurement ID in layout
```

---

## 7. Admin Architecture

**Route handler rule:** Admin routes contain only: `isAuthed` check + `safeParse` + one `supabaseAdmin` call + `NextResponse`. No business logic beyond what fits in those four steps. Multi-table writes (e.g., build + build_parts) are inline in the route handler. Only extract to a helper if the same logic is needed in two different routes.

**Validation rule:** Every admin POST/PUT goes through a Zod `safeParse`. Unknown keys are rejected (no `.passthrough()`). First issue message is returned as `{ error: string }` with status 400.

**Response shape convention (new routes):**
```
GET    → { [entityPlural]: T[] }
POST   → { [entity]: T }
PUT    → { [entity]: T }
DELETE → { success: true }
Error  → { error: string }
```

**Per-model tab props:** Every tab component receives `{ carId, adminSecret, onToast }`. No other props. Tab components load their own data via the `api()` helper from `ui.tsx`.

---

## 8. Description Formatting

### Supported syntax

| Input | Output |
|---|---|
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| Blank line | New `<p>` |
| Single `\n` | `<br>` within paragraph |

### NOT supported (renders as literal text, safe)
Headings, lists, links, nested formatting (`***`), arbitrary HTML.

### Implementation
`lib/renderDescription.tsx` — pure React, no `dangerouslySetInnerHTML`.

### Regression test
```bash
npm run test:description   # 13 cases, all must pass
```

The `editorial_summary` field in `car_fitment` also uses this formatting syntax.

---

## 9. Homepage Behavior

### Feed
- `gallery_photos` where `show_on_home=true`, `is_visible=true`, ordered by `home_sort_order ASC`
- First 6 cards: fixed manual order (admin Save Order)
- Cards 7+: Fisher-Yates shuffle each page load

### Batching
- `INITIAL_BATCH = 11`, `SCROLL_BATCH = 6`
- `fetchedCountRef` tracks actual items fetched. Critical: initial=11, scroll=6, so offset cannot be `page * batchSize` (duplicates items 6-10).
- `isFetchingRef` prevents concurrent IntersectionObserver fires.

### Cards
- `PhotoCard` is `React.memo` — only 2 cards re-render per active-state tick
- Scale transform on wrapper `<div>`, never on `<Image>` props
- `noop`, `COVER_STYLE`, `CONTAIN_STYLE` are module-level stable references
- `willChange: 'transform'` pre-creates GPU layer
- `<Link prefetch={false}>` — prevents RSC route-prefetch fetches on hover
- `onPointerEnter/Leave` with `e.pointerType === 'mouse'` — touch ignored

### Auto-cycle
- Starts 1.2s after first photos load, advances every 3.5s
- `autoStartedRef` gates one-time start — scroll appends never restart timer

---

## 10. Model Gallery Behavior

### Layout — CSS Grid, static, no JS relayout

Span rules pre-computed from photo sequence before render:

| Photo type | Desktop | Mobile |
|---|---|---|
| Vertical | `span 1` (normal) | unchanged |
| Horizontal + vertical partner following | `mgallery-h`: `span 2` | `1/-1` (full row) |
| Lone horizontal (no vertical partner) | `mgallery-lone-h`: full row, img `max-width: 66.666%` centered | `max-width: 100%` |
| Lone leftover vertical | `single`: `span 1`, left-aligned, normal size | unchanged |

### Image rendering
- Plain `<img>`, `width: 100%; height: auto` — natural proportions, no objectFit, no fixed aspect-ratio
- `draggable={false}`, `pointerEvents: none`, context menu blocked on grid wrapper
- No hover effects on model gallery

---

## 11. Upload Pipeline

1. HEIC → heic2any → JPEG blob (browser)
2. Canvas resize to max 2400px, quality 0.88
3. POST to `/api/admin/upload` (stays under Vercel 4.5MB limit)
4. Server: sharp generates 800px thumbnail → both to R2 → DB record with `width`, `height`

---

## 12. Migration Strategy

- Migrations run in filename order. Never edit a deployed file.
- All migrations use `CREATE TABLE IF NOT EXISTS` — re-runnable safely.
- Seeds use `ON CONFLICT DO NOTHING` — re-runnable safely.
- Every migration ends with `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.
- Every migration has a `-- ROLLBACK:` comment at the bottom.
- If a mistake needs correcting, write a new `migration_vNx_fix_[description].sql` file.
- **Order is always: run migration → deploy code → enable feature flag.** Never deploy code that references a table before its migration runs.

### Full migration order

```
schema.sql
migration_v2_final.sql
migration_v3_accessories.sql
migration_v4_fix_rls.sql                   ← REQUIRED, run this before any public access
migration_v5a_build_categories.sql
migration_v5a_fix_page_description.sql     ← run immediately after v5a
migration_v5b_wheel_specs.sql
migration_v5c_part_categories.sql
migration_v5d_fitment.sql
```

---

## 13. Critical Constraints — Do Not Break These

1. **`@import "tailwindcss"` in globals.css** — v3 directives kill all responsive breakpoints
2. **`fetchedCountRef` for scroll offset** — `page * batchSize` duplicates photos 6-10 after initial load of 11
3. **`isFetchingRef` lock in IntersectionObserver** — without it, concurrent fires double-fetch
4. **`prefetch={false}` on `<Link>`** — re-introduces RSC hover fetches
5. **Do not call `imagesLoaded(containerRef.current, ...)`** — creates proxyImages for lazy below-fold images, causing duplicate network requests
6. **Scale transform on wrapper `<div>`, not on `<Image>`** — Image props must be stable references
7. **`transitionDuration: 0` on masonry** — prevents black flash on first appended card
8. **Caption uses opacity transition, not conditional mount** — DOM must stay structurally stable
9. **`a.pgrid-card:hover` CSS override** — without it, global `a:hover { opacity: 0.8 }` dims entire cards
10. **Model gallery uses plain `<img>` with natural proportions** — objectFit:cover crops; fixed aspect-ratio containers cause black bars

---

## 14. Failed Approaches — Do Not Repeat

| What was tried | What went wrong |
|---|---|
| Homepage masonry on model pages | JS relayout on tap, IO conflicts, appended-card flash |
| Fixed aspect-ratio + contain on model gallery | Black bars when dimensions didn't match 2:3 or 4:3 |
| objectFit:cover on model gallery | Cropped images |
| Stretching lone leftover vertical (span 2) | Portrait photos became absurdly wide |
| `imagesLoaded(containerRef.current)` at masonry init | Duplicate image requests for every below-fold lazy image |
| Conditional caption mount/unmount | React subtree change caused Image state re-evaluation |
| Transform on `<Image>` props | New style object each render triggered internal Image useEffects |
| `page * batchSize` for scroll offset | Duplicated photos 6-10 after initial batch of 11 |
| Broad component rewrites | Every rewrite introduced 3 new bugs; surgical fixes are always better |

---

## 15. v5 Content Model Summary

All v5 entities share the same pattern: migration → Zod schema → TypeScript type → API route → admin tab → public renderer. No v5 feature is partial — every entity has all five layers complete.

**Build Categories** — editorial style labels assigned per model. Global CRUD in admin sidebar. Per-model checkbox assignment in Style tab. Renders as tag chips in render slot 7. `page_description` field holds long editorial intro for future category pages.

**Wheel Specs** — OEM vs Aftermarket comparison. One row per car, upsert. Renders as a table in slot 8. Aftermarket column suppressed if no aftermarket data. Empty rows skipped.

**Fitment** — editorial/visual stance data. One row per car, upsert. Renders in slot 9. Has four sub-sections: stance descriptors, wheel guidance, popular options, editorial summary. Returns nothing if `is_visible=false` or all fields null.

**Part Categories** — global taxonomy for aftermarket mods. `icon_ref` field reserved for future NFS-style icon UI. Do not build the NFS UI now — only the data model and admin CRUD.

**Aftermarket Parts** — per-model list, must reference a `part_category` by ID (not free text). Renders grouped by category in slot 10.

---

## 16. SEO Architecture

### Source of truth — one rule, no exceptions

| What | Source | Why |
|---|---|---|
| Canonical base URL | `NEXT_PUBLIC_SITE_URL` env var | URL is deployment config, not content |
| SEO content defaults | `site_settings` DB row | Content changes without a deploy |
| Per-entity SEO fields | Entity row (`seo_title`, `seo_description`, etc.) | Per-page control by admin |

`canonical_base_url` is **never** stored in the DB. Using both DB and env var for the same thing creates conflicts across deployments. The env var wins everywhere: `sitemap.ts`, `robots.ts`, canonical tags, `metadataBase`.

### Fallback chains (cascading, in priority order)

**Title:**
```
entity.seo_title → entity name (model.title / brand.name / category.name)
  → site_settings.site_title → 'DAINEKU'
```

**Description:**
```
entity.seo_description → entity description (truncated to 160 chars)
  → site_settings.default_seo_description → undefined (omit tag)
```

**OG image:**
```
explicit page override → entity.cover_image / entity.og_image_url
  → site_settings.default_og_image → [] (no image tag)
```

**Alt text for contextual photos** (never empty string — car photos are informational, not decorative):
```
photo.alt_text (explicit admin field)
  → photo.caption (admin field, may be descriptive)
  → model/context title + ' — photo' (e.g. 'Honda S2000 — photo')
  → 'JDM car photo' (safe meaningful generic)
```

These chains are implemented in `lib/seo.ts` (`resolveSeoTitle`, `resolveSeoDescription`, `resolveOgImages`, `resolvePhotoAlt`).

### Canonical URL rules

| Page | Canonical |
|---|---|
| Homepage | `${NEXT_PUBLIC_SITE_URL}/` |
| Model page | `${NEXT_PUBLIC_SITE_URL}/cars/${slug}` |
| Future category page | `${NEXT_PUBLIC_SITE_URL}/category/${slug}` |
| Future brand page | `${NEXT_PUBLIC_SITE_URL}/brand/${slug}` |
| Admin | noindex, nofollow (explicit metadata on admin page) |

Query-param filter pages (`/?brand=slug`) have no canonical tag — they are not in the sitemap and are not separate routes.

### Indexing policy (October 2026 — technical SEO pass)

| Page type | Indexed? | In sitemap? |
|---|---|---|
| Homepage `/` | ✅ | ✅ (no `lastmod`: it changes with deploys, not content) |
| `/journal` | ✅ once an article is published; `noindex, follow` while empty | ✅ only when ≥ 1 article |
| `/journal/[slug]` published | ✅ | ✅ `lastmod` = `updated_at` |
| Drafts / scheduled | ❌ 404 until `published_at` ≤ now | ❌ |
| `/privacy`, `/terms` | ✅ | ✅ `lastmod` = `LEGAL_UPDATED` (lib/seo.ts, shared with the pages) |
| Legacy archive: `/archive`, `/cars/*`, `/builds*`, `/parts*` | ❌ `noindex, follow` (routes and data intact, 200) | ❌ |
| Legacy archive with `LEGACY_ARCHIVE_INDEXABLE=true` | ✅ | ✅ |
| Admin panel | ❌ noindex (own metadata; the path is never listed in robots.txt) | ❌ |
| 404s (`app/not-found.tsx`) | ❌ noindex, real 404 status | ❌ |
| Vercel previews / branch deploys | ❌ noindex meta + robots.txt `Disallow: /` + Vercel's own `X-Robots-Tag: noindex` | ❌ (no sitemap advertised) |

**robots.txt** (`app/robots.ts` → `robotsRules` in `lib/seo.ts`): production allows everything except `/api/`. `/_next/` is **not** blocked — Google renders pages with the JS, CSS and `/_next/image` responses under it. Non-production disallows `/`.

**Sitemap** (`app/sitemap.ts`): studio pages only, canonical absolute URLs, real timestamps only (never "now"). Built per request, but the reads behind it are cached (below) so a request costs no query while the cache is warm.

**Structured data** (`lib/jsonld.tsx`): one `@graph` per page with a single `Organization` (`#organization`) that every other node references by `@id`. Homepage: Organization + WebSite + a `VideoGame` node per visible project (The Kanjo, the studio's own racing simulation in development). `/journal`: Blog + BreadcrumbList. Articles: BlogPosting + BreadcrumbList. Nothing is stated that is not visible on the page (no ratings, reviews, addresses, prices).

**Soft 404 fixed**: `app/cars/[slug]/loading.tsx` was removed. A loading boundary makes the App Router flush a 200 shell before `notFound()` runs, so unknown car slugs answered 200 with a 404 body.

**Public read caching** (`lib/data.ts`, `lib/journal.ts`): `getSiteSettings`, `getPublishedArticles` and `getPublishedArticle` sit in the Next.js data cache (`unstable_cache`, 5 minutes, tags `site-settings` / `journal`) and are purged by the admin APIs on every write (`revalidateTag`). Publishing is therefore still immediate, while a normal page request makes no Supabase round trip. An article that becomes public purely by its scheduled `published_at` (no admin write at that moment) appears within the 5-minute window.

**Tests**: `tests/seo.spec.ts` (Playwright, HTTP-level + JavaScript-disabled browser: robots, sitemap resolution, metadata, JSON-LD validity, 404 statuses, legacy noindex, internal links, crawlable assets), `tests/seo-articles.spec.ts` (draft → published → edited → deleted as a crawler sees it; its own Playwright project, run after the parallel suites) and `lib/seo.test.ts` (`npm run test:seo`: preview vs production rules).

### Rendering and performance (October 2026)

| Route | Rendering | Why |
|---|---|---|
| `/`, `/journal`, `/privacy`, `/terms` | Static (ISR, `revalidate = 300`) | No request data is read anywhere above them; the admin APIs purge them at once via the tagged reads (`site-settings`, `journal`) |
| `/journal/[slug]` | Rendered on first request, then cached (ISR) | Purged on edit/unpublish like the index |
| `/journal/feed.xml`, `/sitemap.xml` | Dynamic, cached reads | Cheap; reflect admin writes immediately |
| Legacy archive routes, admin, APIs | Dynamic | Unchanged |

- **No loader anywhere.** The server HTML carries the whole page; `Reveal.tsx` only arms the scroll-reveal *after* mount, for elements still below the fold, and never under `prefers-reduced-motion`. The mobile menu locks scroll only while open.
- **Hero (LCP)**: `StudioHero` keeps the static `hero.png` through `next/image` (`priority`, `fetchPriority="high"`, `sizes="100vw"`, AVIF/WebP). The source is 1672 × 941 px; there is no larger master, so wider candidates are capped by the optimizer.
- **Capability cards** show two details of the hero from their own files (`public/images/brand/hero-crop-{urban,frame}.jpg`, cut by `npm run media:brand`) instead of scaling the whole hero inside the frame, which used to download the full hero two more times (96–114 KB each in Lighthouse).
- **Fonts**: both faces live in `public/fonts/` and are declared in `app/globals.css`; the root layout preloads the two Latin files and `next.config.ts` serves `/fonts/` immutable (rename a file if a font ever changes). Manrope's Latin-ext and Cyrillic subsets load on demand through `unicode-range`. `next/font/local` was dropped: its preload only reached the browser as a `Link` response header on dynamically rendered pages, which the static pages no longer emit, and it produced no usable fallback metrics for these variable files.
- **Smoke suite**: `tests/reset-data-cache.mjs` clears the data cache and the prerendered `/` and `/journal` before `next start`, because `next build` runs without the smoke env (the contact form, the mock backend) while Vercel builds and serves with one env.

**Owner actions outside the repo**: `www.daineku.com` resolves to Vercel but has no certificate (TLS handshake fails) — add the `www` domain to the Vercel project and redirect it to the apex. Search Console: verify the property (admin → Settings → Search Console verification, or DNS), submit `https://daineku.com/sitemap.xml`, and request removal/inspection of any previously indexed `/cars/*`, `/builds/*`, `/archive` URLs as they turn `noindex`.

### OG / Twitter card completeness

**Root layout:** `metadataBase`, default title/description from DB, `openGraph.siteName`, `twitter.card: 'summary_large_image'`.

**Model pages:** `openGraph.type: 'article'`, `openGraph.url` (canonical), `alternates.canonical`, full `twitter` object with card/title/description/images.

**Future category/brand pages** must follow the same pattern — use `resolveSeoTitle`, `resolveSeoDescription`, `resolveOgImages` from `lib/seo.ts`. Add `alternates.canonical` pointing to the canonical URL.

### Site settings SEO fields (migration_v5e)

Two new columns on `site_settings`:

| Column | Purpose |
|---|---|
| `default_seo_description` | Fallback meta description for homepage and pages with no description |
| `default_og_image` | Fallback OG image URL for social shares when no cover image exists |

Editable in admin → Site Settings → SEO Defaults section. No `canonical_base_url` column exists — that is env only.

### robots.ts and sitemap.ts

`app/robots.ts` — allows all crawlers, disallows `/api/` and `/_next/`, references sitemap URL built from `getBaseUrl()`.

`app/sitemap.ts` — lists homepage, `/archive`, published model pages and category listings. Brand query param URLs (`/archive?brand=slug`) intentionally excluded. When `/category/[slug]` or `/brand/[slug]` pages are built, add their entries here at the same time as the route file.

---

## 17. Working With AI Agents

**This project continues in multiple AI environments. Follow these rules to avoid compounding errors.**

### Before any change
1. Read this document fully
2. Verify actual file state with `cat` / `grep` — never trust session memory
3. Classify the feature: DONE / PARTIAL / NOT DONE
4. State the exact root cause before writing code (file, line, mechanism)

### Prompt template for continuation

```
Project: DAINEKU — read HANDOFF.md first before touching anything.

Task: [SINGLE SLICE — one feature, one file group]

Do NOT touch:
- components/PhotoGrid.tsx
- components/MasonryGallery.tsx
- lib/renderDescription.tsx
- CarPageClient.tsx canonical render order (adding new slots is OK)
- fetchedCountRef offset logic in MasonryGallery.tsx

Completion gate (verify before stopping):
[ ] npm run build passes (0 errors)
[ ] npm run test:description passes (13 cases)
[ ] If new API route: Zod safeParse on all writes
[ ] If new public data: returns null/[] on error, never throws
[ ] If new admin tab: uses useToast, EmptyState, ErrorBanner pattern
[ ] Describe exactly what changed and what was NOT changed
```

### Red flags — stop and diagnose
- A fix requires touching the homepage AND model page simultaneously
- A change cascades into layout, masonry, and image logic
- The fix is larger than the bug it addresses

---

## 18. v6 Settings Integrations

**Settings Integrations** (`ga4_measurement_id`, `search_console_verification`, `favicon_url`): all three added to `site_settings`. GA4 renders via Next.js Script in `app/layout.tsx` when a valid `G-XXXXXXXXXX` ID is stored. Search Console renders via Next.js metadata `verification`. Migration: `migration_v6c_settings_integrations.sql`.

**SettingsTab**: three grouped sections — Branding / SEO Defaults / Integrations with inline hints. Image fields (logo, favicon, default OG image) use `ImageUploadField` component.

**v6 Global Builds / Games — superseded by v7.** `global_builds`, `car_builds`, `global_games`, `car_games` tables remain as dormant legacy infrastructure. `GlobalBuildsTab`, `GlobalGamesTab`, `/build/[slug]`, `/game/[slug]` have all been removed from the active product. Do not re-introduce these concepts.

---

## 19. v7 Product Model Refactor

### Per-model tab order (canonical, locked — 9 tabs)

`Gallery → Story → Style → Specs → Fitment → Mods → Builds → Extras → Info`

**Games is fully removed.** Tables dormant. No admin surface. No public pages.

### Build Categories (global, page-bearing)

- Admin: Global → Build Categories
- Public: `/builds` (listing), `/builds/[slug]` (detail with photo masonry)
- Image fields: `icon_ref` (plain text identifier, not a URL), `image_url` (visual hero, upload), `og_image_url` (social override, upload)
- Pages degrade gracefully when `image_url` is null

### Build Instances (per-model, no public page)

- Table: `car_build_instances` + `build_instance_photos`
- Admin: per-model Builds tab
- Minimum to save: category_id + ≥1 photo + description + setup_summary
- First photo in `build_instance_photos` (sort_order ASC) is the featured image
- Rendered as cards in slot 11 on model pages

### Part Categories (global, page-bearing)

- Admin: Global → Part Categories
- Public: `/parts` (listing), `/parts/[slug]` (product cards with affiliate CTA)
- Same image upload pattern as Build Categories

### Aftermarket Parts (product/affiliate model)

- Fields added: `image_url`, `affiliate_url`, `price_range`, `key_specs` (jsonb `[{label, value}]`), `availability`, `is_featured`
- `key_specs` max 8 pairs — maps to schema.org Product `additionalProperty` for rich results

### Image upload system

- `ImageUploadField` component: `app/[adminPath]/components/ImageUploadField.tsx`
- Generic upload route: `app/api/admin/upload-asset/route.ts` — uploads to R2, returns URL only (no DB record)
- `uploadType` param sets R2 folder prefix: `'categories'` | `'settings'` | `'parts'` | `'assets'`
- All entity image fields (Build Categories, Part Categories, Settings, Mods) use this component

### Migrations (v7)

```
migration_v7a_build_categories_image.sql    — adds image_url to build_categories
migration_v7b_part_categories_expansion.sql — adds description, page_description, image_url, SEO, is_published to part_categories
migration_v7c_parts_product_fields.sql      — adds product fields to car_aftermarket_parts
migration_v7d_build_instances.sql           — creates car_build_instances + build_instance_photos
```

### Public pages

| Route | Source entity | notFound() if |
|---|---|---|
| `/builds` | `build_categories` (is_published=true) | — |
| `/builds/[slug]` | `build_categories` | not found or not published |
| `/parts` | `part_categories` (is_published=true, is_active=true) | — |
| `/parts/[slug]` | `part_categories` | not found or not published |

---

## 20. v8 Admin Architecture (Phase 1 — Parts + Builds Refactor)

### FK fix — car_aftermarket_parts

**Problem:** `car_aftermarket_parts` in the live DB was created with a legacy `category text` column and no `category_id uuid` FK. `migration_v5c_part_categories.sql` defined the correct schema but used `CREATE TABLE IF NOT EXISTS` which silently no-oped. PostgREST `.select('*, category:part_categories(...)')` requires a real FK to resolve the join.

**Fix:** `supabase/migration_v5c_fix_parts_category_fk.sql` — additive only, preserves legacy `category` text column, backfills `category_id` from `part_categories.name` (case-insensitive match).

**Field names locked:** Column is `name` not `part_name`. `brand_name` is the manufacturer field. Both confirmed from migration_v5c, types.ts, and Zod schemas.

### global_parts entity (Phase 1)

**Schema:** `migration_v8a_global_parts.sql` — creates `global_parts` + `model_parts`.

`global_parts` is a true product catalog. **No `car_id` anywhere.** Fields: `title`, `brand_name`, `notes`, `image_url`, `affiliate_url`, `price_range`, `key_specs` (jsonb `[{label,value}]`, max 8), `availability`, `is_featured`, `sort_order`, `is_published`, `part_category_id`.

`model_parts` is the **only** car linkage: `(car_id, part_id)` composite PK, both FKs cascade on delete.

`car_aftermarket_parts` is preserved as legacy — untouched, readable, data intact.

### Final admin IA (v8)

```
SIDEBAR

GLOBAL
  Site Settings
  Builds              ← two inner tabs: Build Categories | All Builds
  Parts               ← two inner tabs: Part Categories | Parts

CONTENT
  Models
  Homepage
  Brands

LEGACY
  Accessories ⚠       ← demoted, data readable, not the canonical authoring path
```

### Builds section — management rules (LOCKED)

**All Builds tab** = management index only: visibility toggle, sort order, featured photo, model + category labels.

**Builds are NOT created in the global view.** The global tab shows a banner: "Builds are created inside each model's Builds tab."

Creation, photos, description, setup, wheel specs — all authored in **model → Builds tab**.

This rule must not be violated. Do not add a create form to the global Builds view.

### Parts section

**Part Categories tab** = global category CRUD (page-bearing entities for `/parts/[slug]`).

**Parts tab** = global `global_parts` CRUD — title, brand, affiliate URL, image, price, key specs, availability, is_published.

### Per-model Mods tab (Phase 1)

The Mods tab now shows an internal switcher:
- **Legacy Mods** → existing `car_aftermarket_parts` per-car form (unchanged)
- **Assign Parts (Global)** → toggle `global_parts` onto this model via `model_parts`

The public page still reads `car_aftermarket_parts`. No public behavior changed in Phase 1.

### Accessories (DEPRECATED)

`accessories` table: read-only legacy. Data preserved. No new entries should be created here.

In admin sidebar: moved to **Legacy** group, labelled "Accessories ⚠ Legacy".

Public pages: the `renderBlock('accessories')` in CarPageClient still functions for existing data — do not remove it until all accessory data is confirmed migrated or deleted.

**Parts is the canonical replacement for Accessories.**

### /parts public architecture

```
/parts              → Part Categories listing (published, active)
/parts/[slug]       → Category detail — product cards from car_aftermarket_parts (Phase 1)
                      Phase 2: switch to global_parts after data is populated
model page Mods     → still reads car_aftermarket_parts (Phase 1)
                      Phase 2: NFS-style category nav using model_parts → global_parts
```

**Phase 2 trigger:** at least one `global_parts` row has `is_published = true` AND at least one `model_parts` assignment exists. Only then should the public switch be made. This is a deliberate separate task.

### Canonical fill workflow (Phase 1)

1. Run `migration_v5c_fix_parts_category_fk.sql` → fixes Mods tab error
2. Run `migration_v8a_global_parts.sql` → creates global_parts + model_parts
3. Admin → Global → **Builds** → Build Categories tab → create/publish categories
4. Admin → Global → **Builds** → All Builds tab → manage visibility/order of existing builds
5. Admin → Model → Style tab → assign build categories to models
6. Admin → Model → Builds tab → create build instances (photos + category + description)
7. Admin → Global → **Parts** → Part Categories tab → create/publish part categories
8. Admin → Global → **Parts** → Parts tab → create global parts (affiliate products)
9. Admin → Model → Mods tab → "Assign Parts (Global)" sub-tab → toggle parts onto models
10. Phase 2 (separate): switch public Mods + `/parts/[slug]` to read from global_parts

### Migrations (v8)

```
migration_v5c_fix_parts_category_fk.sql  — FK fix for car_aftermarket_parts
migration_v8a_global_parts.sql           — global_parts + model_parts tables
```

---

## 21. v9 Gallery Image Pipeline, Admin Originals & Lightbox

### Image pipeline (v9 — canonical)

Every gallery photo upload produces **three distinct R2 files**:

| Field | R2 Key Pattern | Content | Access |
|---|---|---|---|
| `original_url` | `cars/{id}/{ts}_orig.jpg` | Clean original, EXIF-normalized, no watermark | **Admin-only via signed URL** |
| `url` | `cars/{id}/{ts}_pub.jpg` | Watermarked public lightbox image | Public |
| `thumb_url` | `cars/{id}/{ts}_thumb.jpg` | Clean 800px thumbnail for grids/cards | Public |

**`original_url` stores the R2 key, not a public URL.** It is never exposed in public API responses. Admin access is via `GET /api/admin/original-url?photo_id=<uuid>` which returns a 15-minute signed URL. Legacy rows with `original_url = null` fall back to `url`.

### Watermark (v9e — static PNG asset)

**Asset:** `public/watermark.png` — a pre-rendered transparent PNG, 1600×140px.
- Text: `DAINEKU.COM`, white, Liberation Sans Bold 700, letter-spacing 0.15em (matching Manrope 800 header style)
- Baked-in dark drop-shadow offset (+3px) for readability on all backgrounds
- Opacity 0.45 applied per-pixel at composite time (not in the asset itself)
- Pixel delta: 66–115 across dark/mid/light/white backgrounds — survives JPEG quality 88

**Why static PNG, not SVG text:**
1. Vercel's serverless runtime does not have Manrope installed. SVG `<text>` nodes rendering against the system font stack produced tofu (empty square glyphs) in production because no matching font was found.
2. Even with a fallback font, opacity 0.16 produced ~24px delta which is destroyed by JPEG block quantization on real photographic content (confirmed by direct pixel measurement).

**The static PNG approach eliminates both problems:**
- No font rendering at upload time — watermark is composited as pixels
- The square-glyph problem is impossible: the asset is already rasterized
- Opacity is applied by scaling the PNG's alpha channel directly, not via SVG attributes

**Compositing:**
- Scaled to 42% of image width at runtime
- Positioned: left=10% of width, top=14% of height (upper third, slightly left of center)
- Uses sharp `.composite([{ input: wmOpaque, left, top, blend: 'over' }])`

**Watermark fallback (v9b — still in force):**
Watermark failure is a hard 500 — no silent clean-public fallback. `url` and `original_url` can never resolve to the same file.

**Thumb fallback:** thumbnail initializes to `originalUrl` (clean), never to `publicUrl`. Grid previews always clean.

**To restyle the watermark:**
1. Edit the SVG string in the generation script (see below)
2. Run: `node --input-type=module scripts/generate-watermark.mjs`
3. Commit the new `public/watermark.png`
4. No code change needed in the upload route

**Generation script:** `scripts/generate-watermark.mjs`

### Public API safety

`app/api/photos/route.ts` uses explicit column selects — `original_url` is not in the list and is never returned to the public. The admin API (`/api/admin/photos`) uses `select('*')` but is auth-gated.

### Admin-only original access

Clicking a photo preview card in the admin gallery calls `/api/admin/original-url?photo_id=…` (requires `x-admin-secret`), receives a signed URL valid for 15 minutes, and opens it in a new tab. No public R2 URL for originals is ever embedded in the admin UI.

### Admin header suppression (v9b → replaced October 2026)

Historically `middleware.ts` flagged the admin request and `app/layout.tsx` read it with `headers()`. That made **every** page dynamic (no CDN caching, a Supabase round trip per request). Since the October 2026 performance pass the public pages live in the route group `app/(studio)/` whose layout renders the header/footer (`components/studio/StudioShell.tsx`); `app/[adminPath]/` is outside the group and gets neither. There is no middleware any more, the root layout reads no request data, and `/`, `/journal`, `/privacy`, `/terms` are statically generated (ISR, `revalidate = 300`, purged at once by the admin APIs through the tagged reads). See §16.

### Migrations (v9)

```
migration_v9a_gallery_original_url.sql  — adds original_url text null to gallery_photos
```

### Lightbox behavior (v9c)

**Mobile:**
- Swipe left/right to navigate photos
- Live drag feedback: image translates horizontally with finger at 35% damping
- Axis lock: gesture must be clearly horizontal before drag activates (prevents vertical scroll interference)
- Threshold: 48px damped movement triggers navigation; below threshold → smooth spring-back (280ms cubic-bezier)
- Nav arrows hidden on `pointer: coarse` devices
- Backdrop click closes, Esc closes, body scroll locked, safe-area-inset-top on close/counter

**Desktop:**
- Large (72px wide) flanking nav zones on each side of the image container
- Background: transparent at rest → `rgba(0,0,0,0.28)` on hover
- `‹` / `›` chevrons centered in each zone
- Hidden on touch-only devices via `@media (pointer: coarse)`
- Clicking the image toggles zoom: `92vw/92vh` → `98vw/96vh`, cursor `zoom-in`/`zoom-out`
- Esc closes zoom first, then lightbox; keyboard arrows disabled while zoomed
- Portrait images: up to 92vh (not artificially constrained)

### Known limitations / watch items

- Exact runtime trigger of watermark failure not confirmed from live logs. Most likely: Vercel cold-start sharp initialization or memory constraint during SVG composite. The fallback path is now safe regardless of trigger.
- `getModelPhotos` in `lib/data.ts` uses `select('*')` — returns `original_url` to server components. Safe because it is only used in admin context or server-side rendering where the value is not forwarded to public client props.
- Phase 2 public parts switch (global_parts → model page Mods + /parts/[slug]) not yet done.

---

## 22. Recommended Next Steps

1. **Run migrations** — `migration_v5c_fix_parts_category_fk.sql`, then `migration_v8a_global_parts.sql` in Supabase SQL Editor
2. **Populate Build Categories + Builds** — Global → Builds → create categories, then model → Builds tab for instances
3. **Populate Part Categories + Parts** — Global → Parts → create categories + product entries
4. **Assign parts to models** — model → Mods → "Assign Parts (Global)" sub-tab
5. **Confirm data populated** — once global_parts has published entries and model assignments, trigger Phase 2 public switch
6. **Phase 2** — switch `/parts/[slug]` + model Mods render to `global_parts`; add NFS-style category nav
7. **Enable v5 public content** — set `FEATURE_MODEL_SPECS_TAB=public` etc. when data confirmed
8. **Brand pages** — needs `description` + SEO columns on `brands` table

---

## Appendix: Critical SQL

```sql
-- Disables RLS — required for model pages to load publicly
-- Run supabase/migration_v4_fix_rls.sql in Supabase SQL Editor

-- Insert default site_settings if missing:
INSERT INTO site_settings (site_title, tiktok_url, youtube_url, instagram_url, nav_links)
VALUES ('DAINEKU', '', '', '', '[]'::jsonb)
ON CONFLICT DO NOTHING;
```

## Appendix: Deploy Commands

```bash
git add .
git commit -m "description"
git branch -M main
git push -u origin main --force
# Vercel auto-deploys on push to main
```

## Appendix: Claude Code Prompt Template

```
Project: DAINEKU
Read HANDOFF.md first. Do NOT start coding immediately.

Task: [single slice name]
Reference file for pattern: [exact filename]

Do NOT change:
- components/PhotoGrid.tsx
- components/MasonryGallery.tsx
- lib/renderDescription.tsx
- CarPageClient.tsx render ORDER (adding new explicit blocks after slot 6 is OK)
- fetchedCountRef offset logic in MasonryGallery.tsx

Completion gate:
[ ] npm run build passes
[ ] npm run test:description passes (13 cases)
[ ] New API routes use Zod safeParse
[ ] New public reads return null/[] on error, never throw
[ ] New admin tabs follow BrandsTab.tsx pattern
```

---

## 23. v10 Studio Homepage (DAINEKU — Real-Time Simulation & Spatial Design)

### Routes

| Route | What |
|---|---|
| `/` | Studio site. Server components in `components/studio/`. Supabase content: social links and up to three Journal articles. |
| `/journal`, `/journal/<slug>` | Studio Journal (table `studio_articles`, edited in the admin → **Journal**). Read per request. |
| `/archive` | The JDM feed (was `/`). `MasonryGallery` + `PhotoGrid`, unchanged batching/ordering. Brand chips → `/archive?brand=<slug>`. |
| `/?brand=<slug>` | 307 → `/archive?brand=<slug>` (`next.config.ts` redirects, query preserved). Bare `/` is unaffected. |

Admin → **Archive Feed** (was "Homepage") curates `/archive`. Data model unchanged (`show_on_home`, `home_sort_order`).

### Studio files

- `components/studio/content.ts` — homepage copy (hero, services, Journal labels, contact). No invented clients, metrics or awards. **Project copy lives in `lib/projects.ts`** (see *Projects* below).
- `components/studio/studio.css` — design system, every rule scoped under `.studio` / `st-*`. The `.studio a` reset uses `:where()` (zero specificity) so it beats the legacy global `a { color: #39FF14 }` by source order without overriding component classes.
- `components/studio/primitives.tsx` — `Crop` (fixed source-pixel region of an image; annotation pins depend on it), `Cover` (whole image, framed by object-position only), **`ArtDirectedCover`** (desktop master + optional phone crop through `getImageProps` + `<picture>`; the frame's CSS aspect-ratio must equal the master's so `object-fit: cover` never scales or cuts), `SectionHeading`, `SectionDivider`, `delay()`.
- `components/studio/visuals.tsx` — `SimulationDiagram` (the services card's vehicle-path figure). Decorative.
- Homepage order (`app/page.tsx`): Hero → `StudioServices` (What We Build) → `ProjectsSection` (The Kanjo case study; Support module when placed "project") → `JournalSection` (hidden with no published article) → `SupportModule` (only when placed "home") → `StudioContact`. Why Daineku, Technical Production, Studio and Process were removed (v10.3 / v11) as repetition.
- `components/studio/Reveal.tsx` — one IntersectionObserver for `[data-reveal]`. Content is visible in server HTML; the hidden state is armed only after mount and never under `prefers-reduced-motion`.

### Projects — portfolio data model (v11)

`lib/projects.ts` is the portfolio: a typed `Project[]` (title, tagline, summary, disciplines, status + one `statusLabel`, cover `{ desktop, mobile?, alt }` as **static image imports**, four `highlights`, optional `gallery`/`video`/`link`, `featured`, `order`, `visible`). `components/studio/ProjectsSection.tsx` lays out the featured project as the case study — title row, the artwork across the whole content column at its *own* aspect ratio, then copy beside the 2 × 2 highlights — and renders any further visible projects as `.st-projects__grid` cards. With one project the grid is not rendered at all, so nothing looks empty. Adding a project = one entry + its artwork; no layout change. Real projects only; `npm run test:projects` enforces the invariants (unique slugs, one featured, ≥ 2592 px desktop cover, no per-system status words).

**Project artwork pipeline.** `npm run media:project -- <source> [--name <base>] [--mobile-focus 0.68] [--mobile-aspect 1.25]` (`scripts/prepare-project-media.mjs`) writes `public/images/projects/<base>.jpg` (full composition, 2592 px = 2 × the 1296 px content column, JPEG q94 **4:4:4**, Lanczos, no sharpening), `<base>-mobile.jpg` (full-height 5:4 window centred on the subject, 1560 px) and `<base>.json` (source sha256 + what was generated). The optimizer re-encodes per width — AVIF first (`images.formats` in `next.config.ts`, 4:4:4), WebP fallback — at `quality 85`. **Do not** commit a pre-squeezed WebP as the master again: the v10 `thekanjo-hero.webp` (2560 px, q80, 4:2:0) was re-encoded to WebP q75 and then enlarged 1.2–1.5× on every display because its `sizes` ignored the `object-fit: cover` scale of a 16:11 frame — that was the "pixelated hero".

The Kanjo's source is `daineku/kanjo` → `public/media/hero/hero.png` (6336×2688, sha256 `006fc676…0499378`; the Kanjo site's own approved hero). It is an upscaled render: measured detail tops out around 2500–3200 px wide (PSNR of a 2560 px round trip is 39 dB, 3168 px 40 dB), so 2592 px is the honest master size and nothing above it would look sharper. Never hotlink GitHub; regenerate from the file.

### Brand assets — `public/images/brand/`

`logo.png`, `title.png`, `hero.png`, `divider.png` are the originals (moved from `components/`). `logo-mark.png`, `title-wordmark.png`, `divider-line.png` are the same pixels with transparent padding trimmed. `og.jpg` is a 1200×630 crop of `hero.png`.
The divider's green line is low-contrast on near-black — it is used once, in the footer.

`public/images/projects/` holds **project artwork, not brand images** (The Kanjo's masters — see *Projects* above for the pipeline and provenance).

### Support module (Patreon) — v11, optional, off by default

A native DAINEKU block (`components/studio/SupportModule.tsx`) that invites visitors to support a project on Patreon: label ("Support The Kanjo" / "Support the studio"), title, what supporters are funding, one CTA to the configured page (`target=_blank rel=noopener noreferrer`), and artwork — the owner's upload or, with a project association, the project's own cover. **No Patreon script, iframe or oEmbed is loaded**: Patreon has no official embed for creator pages (docs.patreon.com covers OAuth/API/webhooks; post embeds run through Embed.ly in the other direction; the old "Become a patron" button is a third-party script), and patreon.com refuses framing. If that changes, add an `embed` mode next to the native one — never arbitrary HTML.

Configuration (`lib/support.ts` → `resolveSupport`), in precedence order: **(1)** `site_settings` columns from `supabase/migration_v11a_support_module.sql` (additive, re-runnable; `support_enabled`, `support_url`, `support_title`, `support_body`, `support_cta`, `support_image_url` + `_alt`, `support_project` = slug from `lib/projects.ts`, `support_placement` = `project` | `home`) — once the row carries them they are the only authority, including "off"; **(2)** otherwise env `PATREON_URL` (+ `SUPPORT_TITLE/BODY/CTA/PROJECT/PLACEMENT/IMAGE_URL/IMAGE_ALT`). The URL must be an https creator page on `patreon.com` with no query/fragment/credentials (`isSupportUrl`; the Zod schema, the admin and the table check all enforce it). Defaults state no tiers, prices or benefits (unit test).

Admin → **Site Settings → Support module (Patreon)**: toggle, URL, project, title, button label, placement, image upload (R2 folder `support/`, capped at 2400 px) + alt, description. The section is read-only until migration v11a is applied, and the settings PUT only includes `support_*` when the loaded row has the columns — saving the rest of the settings can never fail on an un-migrated database.

### Fonts

No font is fetched from Google — at build time or runtime.

- **Manrope** (body, admin, legacy pages, studio) — `@font-face` in `app/globals.css` under the real family name `Manrope`, files in `app/fonts/` (latin, latin-ext, cyrillic variable subsets — byte-identical to what Google Fonts served). Admin inline styles that say `fontFamily: 'Manrope'` keep working.
- **Space Grotesk** (studio display) — `next/font/local` in `app/layout.tsx` (`--font-display`).
- **Do not switch to `next/font/google`** — on Next 15.3.6 its loader crashes on current Google Fonts responses (`Cannot read properties of null (reading '1')`), failing the build.
- `@font-face` must stay *after* `@import "tailwindcss"` (CSS `@import` must precede all other rules).

### Positioning & copy (v10.3)

All homepage copy lives in `components/studio/content.ts`; each section has one job (see the header comment there). British English throughout. The page says what the studio builds, not what kind of organisation it is — no "independent studio" lines.

- **Hero** — the one positioning statement: real-time simulation, interactive 3D environments, cinematic visuals. The meta row gives the specifics (vehicle dynamics · AI traffic, worldbuilding · lighting, trailers · in-engine film).
- **What We Build** — Real-Time Simulation (vehicle dynamics, AI traffic, interactive software, prototypes) · Spatial Design (navigable environments, worldbuilding, scene construction, lighting, rendering) · Cinematic Production (trailers, in-engine cinematics, key art, edit and grade). No interior/architectural design, no client quotes.
- **Selected Work** — The Kanjo, with its real artwork. The **only** link to `https://www.thekanjo.com/` on the page (`KANJO_URL`, "Explore The Kanjo ↗"). Facts: Type, Status, **Core System — Real Car Simulation** (the engine is deliberately not named). Under it, **Developed systems** (`WORK.kanjo.systems`): five systems, each with a status — *Implemented* (runs in the current internal build) or *In progress* (runs, with open defects) — a description of behaviour and four items that were built.
- **Process** and **Contact** carry practical information only.
- Every technical statement about The Kanjo was checked against the game project before publication. The systems list was checked against the game repository on 12 October 2026: AI Traffic and Rival Racing are *In progress* because of open defects; wheel support is validated on the MOZA R3 only. Do not upgrade a status, name other wheels, or add performance figures, platforms, clients or a showreel without checking again.

### Contact — project enquiries

Form fields: name, email, project type (Simulation & Interactive Development / Digital Environment / Spatial Design / Cinematic & Video Production / Other — `PROJECT_TYPE_VALUES` in `lib/contact.ts`), optional timeline, project description. Validation is shared (`lib/contact.ts`) by the form and the server.

**Release gate (v11.1):** the form is rendered, and `POST /api/contact` accepts submissions, only when `CONTACT_FORM_ENABLED=true` **and** the Resend configuration below is complete (`isContactFormEnabled` in `lib/contactDelivery.ts`). Otherwise the section shows "The project enquiry form is being prepared." and the endpoint answers 503 `not_configured`. Set the flag only after the sending domain is **Verified** in Resend and a real test enquiry has arrived, then redeploy. The homepage never renders a mailto fallback (`StudioContact` passes `email={null}`), so the recipient never reaches public HTML or client bundles; a smoke test checks the page, every client chunk, the legal pages, feed and sitemap for it.

**Delivery modes** (decided on the server per request, `app/page.tsx`):

| Configured | Behaviour |
|---|---|
| `CONTACT_FORM_ENABLED=true` + `RESEND_API_KEY` + `CONTACT_FROM_EMAIL` + an inbox | **server**: `POST /api/contact` → Resend → inbox. Success is shown only after Resend returns 2xx with an id; failures show an error plus the direct address. |
| only `CONTACT_EMAIL` | **mailto** fallback: drafts the enquiry in the visitor's email app and says so. |
| nothing | no form; socials or a "being set up" line. |

Env (all server-side, read at request time — no rebuild needed, but Vercel applies env changes only to new deployments, so redeploy):

- `CONTACT_EMAIL` — public studio address shown on the page and used as the mailto fallback (legacy `NEXT_PUBLIC_CONTACT_EMAIL` still honoured).
- `CONTACT_TO_EMAIL` — optional; inbox for enquiries, defaults to `CONTACT_EMAIL`.
- `RESEND_API_KEY` — secret.
- `CONTACT_FROM_EMAIL` — sender on a domain **verified in Resend**, e.g. `DAINEKU <studio@daineku.com>`.
- `RESEND_API_URL` — test only (the smoke suite points it at `tests/mock-resend.mjs`).

Endpoint guards (`app/api/contact/route.ts`): JSON only, 16 KB cap, same-origin `Origin`, honeypot field `website` (silently accepted, never forwarded), minimum fill time 2.5 s measured by the form, 5 submissions / 10 min per client IP (**in-memory, per serverless instance** — a burst limiter, not a global quota), server-side validation with control-character rejection in single-line fields. The recipient is fixed by configuration; anything the browser sends as a recipient is ignored. Reply-To = the visitor's validated address; subject `Project enquiry — <type> — <name>`. Nothing is stored; logs carry only the HTTP status.

### Journal — studio articles

**Data:** one additive table, `studio_articles` (`supabase/migration_v10a_studio_articles.sql`): slug (unique, format-checked), title, excerpt, body (Markdown), category (free text), cover_image_url + cover_alt, is_published, is_featured, sort_order, published_at, created/updated_at (trigger). No legacy table is touched.

- **Access:** RLS on from creation. `anon`/`authenticated` get `SELECT` only, and the policy limits it to `is_published and published_at <= now()`. All writes go through the admin API with the service-role key (server only).
- **Applying it:** run `supabase/audit/security_audit.sql` first and keep the output as the snapshot; then run the migration in the SQL editor. It is re-runnable (every statement is guarded). Rollback (only if nothing must be kept): `drop table public.studio_articles; drop function public.studio_articles_touch();`.
- **Before the table exists** every Journal read returns empty (one warning in the logs): the homepage section is hidden and `/journal` says "No articles have been published yet." Nothing else is affected.

**Admin → Journal** (`app/[adminPath]/components/JournalTab.tsx`, API `app/api/admin/journal/*`, same `x-admin-secret` auth): create, edit, save draft, publish / unpublish (confirmed), slug suggested from the title (`slugify`, validated by `articleSlug`), category with suggestions, excerpt and body with counters, cover upload to R2 (`upload-asset`, folder `journal/`) or pick from previously uploaded Journal images (`/api/admin/journal/media`, R2 list), required alt text for covers, featured toggle and featured order (↑/↓ → `/api/admin/journal/order`), delete with confirmation, and **Preview** rendered with the public components before publishing.

**Validation** (`lib/validation/journal.ts`, strict Zod — unknown fields rejected): limits mirror the table constraints; covers must live on `R2_PUBLIC_URL`; publishing needs an excerpt and a body; a cover needs alt text. First publication stamps `published_at`; unpublishing keeps it.

**Rendering:** `components/studio/ArticleBody.tsx` — `react-markdown` + `remark-gfm`, `skipHtml` (raw HTML is dropped, so no `<script>`/`<iframe>`), default URL transform (no `javascript:`), images HTTPS-only, body headings start at h2. Public pages, the feed and the sitemap are `force-dynamic`, so a save is live immediately — no deploy and no revalidation step.

**Editorial layout (v11)** — `components/studio/Editorial.tsx`: `FeaturedStory` (large 16:10 cover, category + date, title, excerpt, "Read the story") and `LatestList` (compact rows: 4:3 thumb, meta, title, two-line excerpt). Homepage (`JournalSection`): the first article in editorial order (`editorialOrder`: featured in admin order, then newest) is the featured story, the next three are "Latest updates"; the section is absent with no published article and never shows a placeholder. `/journal`: lead story + `JournalCards` grid for the rest, `Blog` JSON-LD, and a link to **`/journal/feed.xml`** (RSS 2.0, `app/journal/feed.xml/route.ts`, advertised with `<link rel="alternate">` on `/` and `/journal`). Covers are plain `<img>` in fixed-ratio frames (any R2 host; no layout shift); Journal uploads are capped at 2400 px wide in `upload-asset`. Journal reads are wrapped in React `cache()` so page + metadata + sitemap share one query per request; `getSiteSettings` likewise.

Client components import Journal types and helpers from `lib/journalShared.ts`, never `lib/journal.ts` — the latter imports the Supabase client and must stay out of browser bundles.

### Database access (legacy tables)

The legacy archive tables pre-date this work and run with RLS disabled (see `migration_v4_fix_rls.sql`). Their access configuration was reviewed in October 2026; the findings and a tested, reversible remediation were handed to the owner privately, not in this public repository. The site performs every write with the service-role key, so restricting the public API roles does not affect the admin. `supabase/audit/security_audit.sql` (read-only) shows the current grants and policies.

### Loader

`SpeedometerLoader` is deleted. `MasonryGallery` renders as soon as the first batch arrives (the fake progress interval and 250 ms delay are gone); first load shows a static skeleton; the infinite-scroll sentinel is an empty 96 px div. `fetchedCountRef` / `isFetchingRef` untouched.

### Admin header suppression (middleware) — superseded

The `x-is-admin` middleware described in earlier versions is gone (October 2026): the public header/footer are provided by the `(studio)` route-group layout, which the admin segment is simply outside of. A client-sent `x-is-admin` header has no meaning anywhere. Admin auth (`isAuthed`, `x-admin-secret`) is unchanged.

### Quality gates (all enforced)

| Command | Expectation |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors (4 accepted warnings: 3 admin `<img>`, 1 deliberate `exhaustive-deps` in MasonryGallery — "fixing" it changes fetch behaviour) |
| `npm run test:description` | 13 passed |
| `npm run test:contact` | 8 passed — enquiry validation (`lib/contact.test.ts`, Node test runner) |
| `npm run test:journal` | 6 passed — article validation and slugs (`lib/journal.test.ts`) |
| `npm run test:projects` | 4 passed — portfolio data invariants (`lib/projects.test.ts`; image imports are stubbed through a loader hook) |
| `npm run test:contact-delivery` | 3 passed — provider configuration and the CONTACT_FORM_ENABLED release gate |
| `npm run test:support` | 5 passed — Support module URL allowlist, precedence and defaults (`lib/support.test.ts`) |
| `npm run test:unit` | all four unit suites together |
| `npm run build` | passes — `next.config.ts` no longer ignores type/lint errors, so the build enforces both |
| `npm run build && npm run test:smoke` | Playwright smoke suite (`tests/smoke.spec.ts`, desktop 1440 + mobile 390, plus a 1920/1440/1280/768/390/360 viewport sweep) — 79 passed, 17 skipped by design. `tests/mock-backend.mjs` now also serves `site_settings` (Support module tests PATCH it) |

- `eslint.config.mjs` uses `FlatCompat` (`@eslint/eslintrc`) with `next/core-web-vitals` + `next/typescript` — the Next 15 setup. The old flat import `eslint-config-next/core-web-vitals` only exists in v16.
- Admin `api()` is `api<T = unknown>()`: pass the response shape at the call site.
- supabase-js has no generated DB types here, so it infers every embedded relation as an array. Many-to-one FK embeds are single objects at runtime — declare the row shape with `.overrideTypes<Row[], { merge: false }>()` (see `getModelBuildInstances`).
- Smoke tests start `next start` with a random throwaway `ADMIN_SECRET_PATH` and mock `/api/photos`; they need no Supabase/R2 credentials. `tests/mock-backend.mjs` stands in for Supabase (the `studio_articles` subset of PostgREST, emulating the RLS rule: anon sees published rows only and cannot write) and for R2 (put, list, public URLs). The app is pointed at it with the test-only `SUPABASE_URL_OVERRIDE` and `R2_ENDPOINT` — **never set those in Vercel**. Admin tests send their own `x-forwarded-for` because the admin API rate-limits to 60 requests/min per IP. The archive pagination test asserts batch sizes through the request sequence, not through an intermediate card count: on short viewports the sentinel is visible as soon as the first batch renders, so the second batch can arrive before a snapshot sees exactly 11 cards (this was the source of an old intermittent failure). Contact delivery runs end to end against a local mock provider (`tests/mock-resend.mjs`) with a reserved `.invalid` inbox — it proves the app's delivery code, **not** real Resend delivery. First run: `npx playwright install chromium`.

### Known pre-existing issue (not changed)

`lib/validation/build-instances.ts` — `BuildInstanceCreateSchema` / `UpdateSchema` do not declare `photo_ids`, and Zod strips unknown keys, so photos selected in the admin Builds tab are never linked through `/api/admin/car-build-instances`. Fixing it changes admin data writes, so it is left for a separate, deliberate change.

### Missing model pages

`/cars/<unknown>` renders the not-found UI with `noindex`, but the HTTP status is 200: `app/cars/[slug]/loading.tsx` is a streaming boundary, so the status is committed before `notFound()` runs (same structure as before v10).

### v11.1 production finalisation (October 2026)

- **Header:** the title wordmark (`public/images/brand/title-wordmark.png`) is the only brand element: 34 px tall on desktop (227 px wide), 28 px below 960 px; the header stays 76 / 64 px. The D mark and the separate DAINEKU text label are gone, and the hero no longer repeats the wordmark — it opens with the eyebrow "Creative Technology & Simulation Studio".
- **Navigation:** Capabilities (`/#services`) · Projects (`/#work`) · Articles (`/journal`, active on `/journal/*`). Routes are unchanged; the Journal section label reads "Articles".
- **Favicons:** `npm run icons` (`scripts/build-favicons.mjs`) builds `app/favicon.ico` (16/32/48), `app/icon.png` (512) and `app/apple-icon.png` (180, on #080c09) from `logo-mark.png`. The layout no longer reads `site_settings.favicon_url`.
- **Footer:** divider artwork, © line, Privacy and Terms only. The archive, builds and parts routes still work but are no longer linked. `lib/siteConfig.ts` was removed with the old footer.
- **Legal:** `/privacy` and `/terms` (`components/studio/LegalPage.tsx`), written from the implementation. **Production drafts:** they name no legal entity, address or governing law; have them reviewed, and update them when data handling changes (analytics, stored enquiries, new providers).
- **SEO:** `STUDIO_TITLE` = "DAINEKU | Creative Technology & Simulation Studio" and `STUDIO_DESCRIPTION` in `lib/seo.ts` are the homepage metadata and the layout defaults (title template `%s | DAINEKU`); the legacy `site_settings` SEO description / OG image are no longer used as defaults. Sitemap lists /privacy and /terms; previews stay noindex.
