# DAINEKU — Development Handoff

**Code is the source of truth. When this document conflicts with actual files, the files win.**  
Read this fully before touching any code. It encodes hard-earned lessons.

---

## Source of Truth — Key Files

When verifying behavior, these are the files that matter most:

| File | Controls |
|---|---|
| `app/cars/[slug]/CarPageClient.tsx` | Model page render order, gallery, description placement (does NOT import PhotoGrid — that is homepage only) |
| `lib/renderDescription.tsx` | Description text formatter (bold, italic, paragraphs) |
| `components/PhotoGrid.tsx` | Homepage masonry cards, memoization, auto-cycle, image stability |
| `components/MasonryGallery.tsx` | Infinite scroll, batching, fetch lock, ordering |
| `app/[adminPath]/components/ModelEditor.tsx` | Admin CRUD, upload pipeline |
| `lib/data.ts` | All public DB queries (enforces `is_published`) |
| `lib/types.ts` | All TypeScript types including `GalleryPhoto.width/height` |
| `app/globals.css` | Tailwind v4 init, all custom CSS classes |
| `supabase/migration_v4_fix_rls.sql` | **Disables RLS — required for public pages** |

---

## 1. Project Overview

**DAINEKU** is a premium JDM automotive archive site. It is an editorial photo experience, not a car database.

**Homepage:** A curated photo feed. The owner manually selects individual photos to appear. Same model can appear multiple times via different photos. Each photo has its own caption. Cards link to their model page. NOT a model directory. NOT auto-generated.

**Model pages:** One page per car model. Content order: cover hero → gallery (with model title) → description → builds → accessories → videos → racing games. Gallery is the centerpiece; images must be fully visible, not cropped.

**Admin:** Internal CMS at `yourdomain.com/[ADMIN_SECRET_PATH]`. Manages models, photos, homepage feed, brands, accessories, site settings.

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

**Critical Tailwind v4 note:** `globals.css` line 3 must be `@import "tailwindcss"`. Changing to v3 `@tailwind base/components/utilities` silently kills ALL `sm:`, `md:`, `lg:` responsive classes across the entire site.

---

## 3. Project Structure

```
app/
  page.tsx                    Homepage — wraps MasonryGallery in Suspense
  layout.tsx                  Root layout — fonts, Header
  globals.css                 Tailwind v4 init + all custom CSS
  cars/[slug]/
    page.tsx                  Model page server component — fetches all data
    loading.tsx               Animated SpeedometerLoader during server fetch
    CarPageClient.tsx         Client renderer — gallery, description, blocks
  [adminPath]/
    page.tsx                  Auth check → AdminClient
    AdminClient.tsx           Sidebar layout
    components/
      ModelEditor.tsx         Models CRUD, upload, photos per model
      HomepageTab.tsx         Homepage feed curation, Save Order
      AccessoriesTab.tsx      Global accessories
      BrandsTab.tsx           Brands CRUD
      SettingsTab.tsx         Site settings
  api/
    photos/route.ts           Public: paginated homepage photos
    brands/route.ts           Public: brands list
    site-settings/route.ts    Public: site settings
  api/admin/                  All require x-admin-secret header
    upload/route.ts           POST multipart → sharp → R2 → DB
    cars/route.ts             CRUD models (POST forces is_published=true)
    photos/route.ts           CRUD gallery photos
    homepage/route.ts         Feed + ordering
    brands/ builds/ videos/ games/ blocks/ accessories/ settings/

components/
  PhotoGrid.tsx               Memoized masonry card renderer (homepage)
  MasonryGallery.tsx          Infinite scroll wrapper
  Header.tsx                  Nav, brands dropdown, socials
  SpeedometerLoader.tsx       Loading animation (compact prop for scroll)

lib/
  renderDescription.tsx       Description text formatter — safe, no dangerouslySetInnerHTML
  renderDescription.test.ts   Unit tests (13 cases)
  types.ts                    All TypeScript types
  supabase.ts                 supabase (anon) + supabaseAdmin (service role)
  data.ts                     Public read queries (is_published enforced)
  r2.ts                       R2 upload/delete helpers
  adminAuth.ts                isAuthed() — x-admin-secret check

supabase/
  schema.sql                     Initial schema
  migration_v2.sql               v2 draft (superseded by v2_final)
  migration_v2_final.sql         Brands, model_blocks, build_parts — run this, not v2.sql
  migration_v3_accessories.sql   hidden_for_car_ids on accessories
  admin-policies.sql             RLS policy drafts (superseded by v4)
  admin-policies-correct.sql     RLS policy drafts (superseded by v4)
  migration_v4_fix_rls.sql       CRITICAL: disables RLS on all tables — run last
```

**Homepage render path:**
`app/page.tsx` → `<Suspense>` → `MasonryGallery` → `PhotoGrid` → `PhotoCard` (React.memo) → `<Link prefetch={false}>` → `<Image>`

**Model page render path:**
`app/cars/[slug]/page.tsx` (server) → `CarPageClient` → `renderBlock('gallery')` → `ModelGallery` → plain `<img>`

---

## 4. Database Schema

### `site_settings`
Single row. `site_title`, `logo_url`, social URLs, `nav_links` (JSONB). If missing, header renders blank — insert manually via Supabase SQL.

### `cars` (models)
`id, title, slug, is_published, brand_id, cover_image, description, subtitle, sort_order`. `is_published=true` required for public access. All new models POST with `is_published=true` (forced in API). Publish workflow is intentionally removed from admin UI.

### `gallery_photos`
`id, car_id, url, thumb_url, orientation, show_on_home, home_sort_order, sort_order, is_visible, caption, alt_text, width, height`

Key fields:
- `width, height` — real pixel dimensions stored at upload. Used for natural aspect-ratio in model gallery. Falls back to orientation bucket if null.
- `show_on_home` / `home_sort_order` — homepage feed
- `sort_order` — order within model gallery

### `model_blocks`
Controls which content blocks appear on a model page and in what order. If empty, `DEFAULT_BLOCK_ORDER` applies: `['gallery', 'builds', 'accessories', 'videos', 'racing_games']`.

### `accessories`
Global by default. `hidden_for_car_ids uuid[]` excludes specific models.

---

## 5. Model Page — Canonical Content Order

```
Cover hero image (if model.cover_image exists)
↓
Gallery  — renderBlock('gallery') — skipped if photos.length === 0
↓
Description  — renderDescription(model.description) — skipped if null/empty
↓
Builds  \
Accessories  | remaining activeBlocks, filtered from gallery, in block order
Videos   |
Games   /
```

This order is implemented literally in `CarPageClient.tsx` — not inferred from block ordering. The gallery and description are rendered explicitly before the `activeBlocks.filter()` loop.

**If gallery has no photos:** `renderBlock('gallery')` returns `null`. Description still renders in its slot (second position). Order is stable.

---

## 6. Description Formatting

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
`lib/renderDescription.tsx` — pure React, no `dangerouslySetInnerHTML`. Parses inline markers with regex, splits on blank lines to produce `<p>` elements.

### Regression test
```bash
npm run test:description   # 13 cases, all must pass
```

### Admin authoring
Description textarea in admin (Models → select model) has an inline format hint. Placeholder shows supported syntax.

### Backward compatibility
Plain text and existing multiline entries render correctly without modification.

---

## 7. Homepage Behavior

### Feed
- `gallery_photos` where `show_on_home=true`, `is_visible=true`, ordered by `home_sort_order ASC`
- First 6 cards: fixed manual order (admin Save Order)
- Cards 7+: Fisher-Yates shuffle each page load
- Scroll batches: always shuffled
- Brand filter: `?brand=slug`

### Batching
- `INITIAL_BATCH = 11`, `SCROLL_BATCH = 6`
- `fetchedCountRef` tracks actual items fetched. Critical: initial=11, scroll=6, so offset cannot be `page * batchSize` (that gives 6 after first load, duplicating items 6-10).
- `isFetchingRef` prevents concurrent IntersectionObserver fires.

### Cards
- `PhotoCard` is `React.memo` — only 2 cards re-render per active-state tick
- Scale transform on wrapper `<div>`, never on `<Image>` props
- `noop`, `COVER_STYLE`, `CONTAIN_STYLE` are module-level stable references
- `willChange: 'transform'` pre-creates GPU layer
- `<Link prefetch={false}>` — prevents RSC route-prefetch fetches on hover
- `onPointerEnter/Leave` with `e.pointerType === 'mouse'` — touch ignored, mobile auto-cycle uninterrupted
- `imagesLoaded` is NOT called on the full container — CSS `aspect-ratio` provides correct heights

### Auto-cycle
- Starts 1.2s after first photos load, advances every 3.5s
- `startAuto` has `[]` deps — reads photos via `photosRef.current`
- `autoStartedRef` gates one-time start — scroll appends never restart timer
- Resumes 8s after hover leave

---

## 8. Model Gallery Behavior

### Layout — CSS Grid, static, no JS relayout

```
.mgallery-grid { grid-template-columns: repeat(3, 1fr) }
```

Span rules pre-computed from photo sequence before render:

| Photo type | Desktop | Mobile |
|---|---|---|
| Vertical | `span 1` (normal) | `span 1` (unchanged) |
| Horizontal + vertical partner following | `mgallery-h`: `span 2` | `1 / -1` (full row) |
| Lone horizontal (no vertical partner) | `mgallery-lone-h`: full row, img `max-width: 66.666%` centered | `max-width: 100%` |
| Lone leftover vertical | `single`: `span 1`, left-aligned, normal size | unchanged |

### Image rendering
- Plain `<img>`, `width: 100%; height: auto` — natural proportions, no objectFit, no fixed aspect-ratio container
- `draggable={false}`, `pointerEvents: none`
- Context menu blocked on grid wrapper
- No hover effects — `.mgallery-item` has no `:hover` filter

---

## 9. Upload Pipeline

1. HEIC → heic2any → JPEG blob (browser, no server dependency)
2. Canvas resize to max 2400px, quality 0.88
3. POST to `/api/admin/upload` (stays under Vercel 4.5MB limit)
4. Server: sharp generates 800px thumbnail → both to R2 → DB record with `width`, `height`

**Do not wire presigned URL upload** without configuring R2 CORS first. Routes exist (`/api/admin/upload-url`, `/api/admin/photo-record`) but are unused.

---

## 10. Critical Constraints — Do Not Break These

1. **`@import "tailwindcss"` in globals.css** — v3 directives kill all responsive breakpoints
2. **`fetchedCountRef` for scroll offset** — `page * batchSize` duplicates photos 6-10 after initial load of 11
3. **`isFetchingRef` lock in IntersectionObserver** — without it, concurrent fires double-fetch
4. **`prefetch={false}` on `<Link>`** — re-introduces RSC hover fetches
5. **Do not call `imagesLoaded(containerRef.current, ...)`** — creates proxyImages for lazy-loaded below-fold images, causing duplicate network requests
6. **Scale transform on wrapper `<div>`, not on `<Image>`** — Image props must be stable
7. **`transitionDuration: 0` on masonry** — prevents black flash on first appended card
8. **Caption uses opacity transition, not conditional mount** — DOM must stay structurally stable
9. **`a.pgrid-card:hover` CSS override** — without it, global `a:hover { opacity: 0.8 }` dims entire cards
10. **Model gallery uses plain `<img>` with natural proportions** — objectFit:cover crops; fixed aspect-ratio containers cause black bars unless matched exactly to real dimensions

---

## 11. Failed Approaches — Do Not Repeat

| What was tried | What went wrong |
|---|---|
| Homepage masonry on model pages | JS relayout on tap, IO conflicts, appended-card flash |
| Fixed aspect-ratio + contain on model gallery | Black bars when actual dimensions didn't match 2:3 or 4:3 bucket |
| objectFit:cover on model gallery | Cropped images |
| Stretching lone leftover vertical (span 2) | Portrait photos became absurdly wide |
| `imagesLoaded(containerRef.current)` at masonry init | Duplicate image requests for every below-fold lazy image |
| Conditional caption mount/unmount | React subtree change caused Image state re-evaluation |
| Transform on `<Image>` props | New style object each render triggered internal Image useEffects |
| `page * batchSize` for scroll offset | Duplicated photos 6-10 after initial batch of 11 |
| Adaptive batchSize (24/16/8 based on latency) | Unpredictable offset, removed in favor of fixed SCROLL_BATCH=6 |
| Broad component rewrites | Every rewrite introduced 3 new bugs; surgical fixes are always better |

---

## 12. Working With AI Agents

**This project continues in multiple AI environments. Follow these rules to avoid compounding errors.**

### Before any change
1. Read this document
2. Verify actual file state with `cat` / `grep` — never trust memory or previous session summaries
3. Classify the feature: DONE / PARTIAL / NOT DONE
4. State the exact root cause before writing code (file, line, mechanism)

### During implementation
- One problem per session — no combined fixes
- Minimal diff — if a fix touches >3 files, scope is likely wrong
- Homepage and model page are **different systems** — different constraints, never mix
- Do not refactor working code alongside a bug fix
- Do not mark features DONE unless implemented in code

### After implementation
- Run `npm run build` — must complete without errors
- Run `npm run test:description` — must pass 13 cases
- Update HANDOFF.md if behavior or constraints change

### Red flags — stop and diagnose
- A fix makes sense but requires touching the homepage AND model page
- A change cascades into layout, masonry, and image logic simultaneously
- The "fix" is larger than the bug it addresses

---

## 13. Block Development Rules

For any new content block:

1. Define before coding: purpose, data source, required/optional fields, empty state, desktop and mobile layout
2. Every block must return `null` if data is empty — never render empty wrappers
3. Wrap render in try/catch inside `renderBlock`
4. Use the `Section` + `SectionLabel` pattern
5. Add to `DEFAULT_BLOCK_ORDER` and admin block type list
6. Do not introduce state into `CarPageClient`
7. Mobile and desktop layout rules must be defined separately

---

## 14. Recommended Next Steps

In priority order, each as its own scoped step:

1. Model page lightbox/fullscreen — isolated new component, no existing code touched
2. Admin UX improvements — drag-and-drop ordering, bulk operations
3. New content blocks — follow Section 13 rules exactly
4. SEO — OG images, JSON-LD, sitemap expansion
5. Small visual polish — typography, spacing, gradient tuning

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
git branch -M main       # branch must be main, not master
git push -u origin main --force
# Vercel auto-deploys on push to main
```

## Appendix: Genspark Starter Prompt

```
Project: DAINEKU — JDM automotive archive site
Repo: github.com/daineku/jdm-site
Live: daineku.com

Stack: Next.js 15.3.6 (App Router) · TypeScript · Tailwind CSS v4 ·
Supabase (PostgreSQL) · Cloudflare R2 · Vercel

BEFORE DOING ANYTHING:
1. Read HANDOFF.md in the repo root fully
2. Confirm: homepage render path, model page render path, top 10 constraints from Section 10
3. Summarize what you understand before proceeding

Working rules:
- One problem per session — no combined fixes
- No coding without diagnosis (file, line, mechanism)
- Verify file state with cat/grep before claiming what code says
- Minimal diffs only
- Homepage and model page are different systems — never mix them
- Code is the source of truth, not session memory
```

## DO NOT BREAK (Critical Stability Rules)

1. Homepage Masonry / PhotoGrid logic
   - do not refactor batching, offset, memoization
   - do not reintroduce imagesLoaded scanning

2. Model page content order
   - gallery → description → blocks is canonical

3. Description rendering
   - no dangerouslySetInnerHTML
   - no markdown libraries without strong reason
   - preserve current parser behavior

4. Admin → frontend data flow
   - must remain backward compatible with existing DB data

Violating these rules previously caused real regressions.
Treat them as stability constraints, not suggestions.
