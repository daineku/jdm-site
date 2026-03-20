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
  url: string
  thumb_url: string | null
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
  updated_at: string
}

export type NavLink = {
  label: string
  href: string
}
