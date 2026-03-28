# DAINEKU — Development Handoff

**Code is the source of truth. When this document conflicts with actual files, the files win.**  
Read this fully before touching any code. It encodes hard-earned lessons.

---

## Source of Truth — Key Files

When verifying behavior, these are the files that matter most:

| File | Controls |
|---|---|
| `app/cars/[slug]/CarPageClient.tsx` | Model page render order (10 sections), gallery, description, v5 blocks |
| `lib/renderDescription.tsx` | Description text formatter (bold, italic, paragraphs) |
| `components/PhotoGrid.tsx` | Homepage masonry cards, memoization, auto-cycle, image stability |
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
  page.tsx                    Homepage — wraps MasonryGallery in Suspense
  layout.tsx                  Root layout — fonts, Header
  globals.css                 Tailwind v4 init + all custom CSS
  sitemap.ts                  Sitemap — uses NEXT_PUBLIC_SITE_URL env var
  cars/[slug]/
    page.tsx                  Model page server component — fetches all 10 data sources
    loading.tsx               Animated SpeedometerLoader during server fetch
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
  Header.tsx                  Nav, brands dropdown, socials
  SpeedometerLoader.tsx       Loading animation (compact prop for scroll)

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

### Indexing policy

| Page type | Indexed? | In sitemap? |
|---|---|---|
| Homepage | ✅ | ✅ |
| Published model pages | ✅ | ✅ |
| Admin panel | ❌ noindex | ❌ |
| Unpublished models | ❌ 404 (notFound()) | ❌ |
| Brand filter (`?brand=x`) | Crawlable, no canonical | ❌ |
| Vercel preview deployments | ❌ noindex (VERCEL_ENV !== 'production') | ❌ |
| Future category pages | ✅ when `is_published=true` | ✅ when built |
| Future brand pages | ✅ when route exists | ✅ when built |

### Staging / preview noindex

`app/layout.tsx` checks `process.env.VERCEL_ENV`. Any Vercel deployment where `VERCEL_ENV !== 'production'` gets `robots: { index: false, follow: false }`. Local dev has no `VERCEL_ENV` set and is not indexed by crawlers anyway. Production Vercel sets `VERCEL_ENV=production` automatically.

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

`app/sitemap.ts` — lists homepage + published model pages only. Brand query param URLs (`/?brand=slug`) intentionally excluded. When `/category/[slug]` or `/brand/[slug]` pages are built, add their entries here at the same time as the route file.

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

### Admin header suppression (v9b)

- `middleware.ts` sets `x-is-admin: 1` on responses for paths matching `/$ADMIN_SECRET_PATH`
- `app/layout.tsx` reads that header via `await headers()` and skips `<Header />` server-side
- No client-side MutationObserver or DOM hacks. No flicker.

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
