// ============================================================
// Core types — aligned with database schema v2
// ============================================================

export type Brand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
}

export type Model = {
  id: string
  title: string
  slug: string
  description: string | null
  subtitle: string | null
  brand: string | null       // legacy text field
  brand_id: string | null    // FK to brands
  cover_image: string | null
  is_published: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  // joined
  brand_data?: Brand | null
}

export type GalleryPhoto = {
  id: string
  car_id: string
  url: string              // watermarked public lightbox image (new uploads); clean image (legacy rows)
  thumb_url: string | null // clean preview thumbnail — used in grids, cards, homepage
  original_url: string | null // clean original — admin-only; null for legacy rows
  orientation: 'vertical' | 'horizontal'
  sort_order: number
  home_sort_order: number
  show_on_home: boolean
  is_visible: boolean
  caption: string | null
  alt_text: string | null
  width: number | null
  height: number | null
  created_at: string
  // joined
  car?: Pick<Model, 'id' | 'title' | 'slug' | 'brand'>
}

export type BlockType =
  | 'gallery'
  | 'builds'
  | 'accessories'
  | 'videos'
  | 'racing_games'
  | 'rich_text'
  | 'media'

export type ModelBlock = {
  id: string
  car_id: string
  block_type: BlockType
  title: string | null
  sort_order: number
  is_visible: boolean
  config: Record<string, any>
  created_at: string
}

export type Build = {
  id: string
  car_id: string
  title: string
  description: string | null
  parts: string[]           // legacy array — kept for backward compat
  sort_order: number
  is_visible: boolean
  // joined
  build_parts?: BuildPart[]
}

export type BuildPart = {
  id: string
  build_id: string
  name: string
  sort_order: number
  notes: string | null
}

export type Accessory = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  buy_url: string | null
  store: 'amazon' | 'ebay' | 'jegs' | 'other'
  car_ids: string[]         // legacy — kept for backward compat
  category: string | null
  sort_order: number
  is_active: boolean
}

export type Video = {
  id: string
  car_id: string
  tiktok_url: string
  embed_type: string
  embed_id: string | null
  title: string | null
  sort_order: number
  is_visible: boolean
}

export type RacingGame = {
  id: string
  car_id: string
  game_title: string
  game_logo_url: string | null
  description: string | null
  external_url: string | null
  sort_order: number
  is_visible: boolean
}

export type SiteSettings = {
  id: string
  site_title: string
  logo_url: string | null
  tiktok_url: string
  youtube_url: string
  instagram_url: string
  nav_links: NavLink[]
  // SEO content defaults
  // Note: canonical base URL comes from NEXT_PUBLIC_SITE_URL env var, not here
  default_seo_description: string | null
  default_og_image: string | null
  // Integrations (migration_v6c)
  ga4_measurement_id: string | null
  search_console_verification: string | null
  favicon_url: string | null
  updated_at: string
}

export type NavLink = {
  label: string
  href: string
}

// ── v5 Types ──────────────────────────────────────────────────────────────────

export type BuildCategory = {
  id: string
  name: string
  slug: string
  description: string | null       // short — shown in cards/lists
  page_description: string | null  // long editorial intro — shown on category page
  // Image fields — semantic distinction matters:
  icon_ref: string | null          // icon/symbol identifier for future icon-based UI (not a URL)
  image_url: string | null         // visual hero/listing image — /builds listing + /builds/[slug]
  og_image_url: string | null      // social/OG share override only — not rendered visibly
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  is_published: boolean
  created_at: string
}

export type CarWheelSpecs = {
  id: string
  car_id: string
  // OEM
  oem_wheel_size_front: string | null
  oem_wheel_size_rear: string | null
  oem_offset_front: string | null
  oem_offset_rear: string | null
  oem_tire_front: string | null
  oem_tire_rear: string | null
  oem_notes: string | null
  // Aftermarket
  am_wheel_brand: string | null
  am_wheel_model: string | null
  am_wheel_size_front: string | null
  am_wheel_size_rear: string | null
  am_offset_front: string | null
  am_offset_rear: string | null
  am_tire_front: string | null
  am_tire_rear: string | null
  am_notes: string | null
  created_at: string
  updated_at: string
}

export type CarFitment = {
  id: string
  car_id: string
  fitment_style: string | null        // 'flush' | 'poke' | 'stance' | 'tucked'
  ride_height: string | null          // 'slammed' | 'low' | 'daily' | 'stock'
  camber_look: string | null          // 'aggressive' | 'slight' | 'zero'
  best_wheel_style: string | null     // 'mesh' | 'multi-spoke' | 'dish' | 'split-spoke'
  best_diameter: string | null        // '17"' | '18"' | '19"'
  observed_rim_guess: string | null   // what's actually on the car
  popular_rim_option_1: string | null // curated suggestion
  popular_rim_option_2: string | null // curated suggestion
  editorial_summary: string | null    // supports **bold** / *italic* formatting
  is_visible: boolean
  created_at: string
  updated_at: string
}

export type PartCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  page_description: string | null
  image_url: string | null
  og_image_url: string | null
  seo_title: string | null
  seo_description: string | null
  icon_ref: string | null
  sort_order: number
  is_active: boolean
  is_published: boolean
  created_at: string
}

export type AftermarketPart = {
  id: string
  car_id: string
  category_id: string | null
  name: string
  brand_name: string | null
  notes: string | null
  sort_order: number
  // Product/affiliate fields (migration_v7c)
  image_url: string | null
  affiliate_url: string | null
  price_range: string | null                   // editorial e.g. "$450–$600"
  key_specs: { label: string; value: string }[] // [{label, value}] pairs, max 8
  availability: 'in_stock' | 'limited' | 'discontinued' | null
  is_featured: boolean
  created_at: string
  // joined
  category?: Pick<PartCategory, 'id' | 'name'> | null
}

// ── v6 Types ──────────────────────────────────────────────────────────────────

export type GlobalBuild = {
  id: string
  title: string
  slug: string
  description: string | null       // short — cards/lists
  page_description: string | null  // long editorial intro — /build/[slug] page
  logo_url: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  sort_order: number
  is_published: boolean
  created_at: string
}

export type GlobalGame = {
  id: string
  title: string
  slug: string
  description: string | null
  page_description: string | null
  logo_url: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  sort_order: number
  is_published: boolean
  created_at: string
}

// ── v7 Types ──────────────────────────────────────────────────────────────────

export type CarBuildInstance = {
  id: string
  car_id: string
  category_id: string
  title: string
  description: string          // required — build story/notes
  setup_summary: string        // required — quick config label
  // Build-specific wheel setup
  wheel_brand: string | null
  wheel_model: string | null
  wheel_size_front: string | null
  wheel_size_rear: string | null
  offset_front: string | null
  offset_rear: string | null
  tire_front: string | null
  tire_rear: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
  // joined
  category?: Pick<BuildCategory, 'id' | 'name' | 'slug'> | null
  photos?: BuildInstancePhoto[]
}

export type BuildInstancePhoto = {
  build_id: string
  photo_id: string
  sort_order: number
  // joined
  photo?: Pick<GalleryPhoto, 'id' | 'url' | 'thumb_url' | 'orientation'>
}

// ── v8 Types ──────────────────────────────────────────────────────────────────

export type GlobalPart = {
  id: string
  part_category_id: string | null
  title: string
  brand_name: string | null
  notes: string | null
  image_url: string | null
  affiliate_url: string | null
  price_range: string | null
  key_specs: { label: string; value: string }[]
  availability: 'in_stock' | 'limited' | 'discontinued' | null
  is_featured: boolean
  sort_order: number
  is_published: boolean
  created_at: string
  // joined
  category?: Pick<PartCategory, 'id' | 'name' | 'slug'> | null
}
