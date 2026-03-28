import { supabase } from './supabase'
import type { Model, GalleryPhoto, Brand, SiteSettings } from './types'

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data } = await supabase.from('site_settings').select('*').single()
  return data
}

export async function getBrands(): Promise<Brand[]> {
  const { data } = await supabase
    .from('brands').select('*').eq('is_visible', true).order('sort_order')
  return data || []
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const { data } = await supabase.from('brands').select('*').eq('slug', slug).single()
  return data
}

export async function getModels(brandId?: string): Promise<Model[]> {
  let query = supabase
    .from('cars')
    .select('*, brand_data:brands(id,name,slug,logo_url)')
    .eq('is_published', true)
    .order('sort_order')
  if (brandId) query = query.eq('brand_id', brandId)
  const { data } = await query
  return data || []
}

// PUBLIC: only published models are accessible
export async function getModelBySlug(slug: string): Promise<Model | null> {
  const { data } = await supabase
    .from('cars')
    .select('*, brand_data:brands(id,name,slug,logo_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data
}

export async function getHomePhotosPage(offset: number, limit: number): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from('gallery_photos')
    .select('*, car:cars(id,title,slug,brand,brand_id)')
    .eq('show_on_home', true)
    .eq('is_visible', true)
    .order('home_sort_order', { ascending: true })
    .range(offset, offset + limit - 1)
  return data || []
}

export async function getModelPhotos(carId: string): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from('gallery_photos').select('*')
    .eq('car_id', carId).eq('is_visible', true).order('sort_order')
  return data || []
}

export async function getModelBlocks(carId: string) {
  const { data } = await supabase
    .from('model_blocks').select('*')
    .eq('car_id', carId).eq('is_visible', true).order('sort_order')
  return data || []
}

export async function getModelBuilds(carId: string) {
  const { data } = await supabase
    .from('builds').select('*, build_parts(*)')
    .eq('car_id', carId).eq('is_visible', true).order('sort_order')
  return data || []
}

// Accessories show on ALL models by default
// Hidden only if model ID is in hidden_for_car_ids
export async function getModelAccessories(carId: string) {
  const { data: all } = await supabase
    .from('accessories').select('*').eq('is_active', true).order('sort_order')
  if (!all || all.length === 0) return []
  return all.filter((acc: any) => {
    const hiddenFor: string[] = acc.hidden_for_car_ids || []
    return !hiddenFor.includes(carId)
  })
}

export async function getModelVideos(carId: string) {
  const { data } = await supabase
    .from('videos').select('*')
    .eq('car_id', carId).eq('is_visible', true).order('sort_order')
  return data || []
}

export async function getModelGames(carId: string) {
  const { data } = await supabase
    .from('racing_games').select('*')
    .eq('car_id', carId).eq('is_visible', true).order('sort_order')
  return data || []
}

// ── v5 public reads ───────────────────────────────────────────────────────────
// All functions degrade gracefully: return null/[] on error, never throw.
// PGRST116 = "no rows returned" — expected, not logged.

export async function getModelFitment(carId: string) {
  const { data, error } = await supabase
    .from('car_fitment')
    .select('*')
    .eq('car_id', carId)
    .eq('is_visible', true)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') {
    console.error('[data.getModelFitment]', { carId, error: error.message, code: error.code })
  }
  return data ?? null
}

export async function getModelCategories(carId: string) {
  const { data, error } = await supabase
    .from('car_build_categories')
    .select('category:build_categories(id, name, slug, description, icon_ref, sort_order)')
    .eq('car_id', carId)
  if (error) {
    console.error('[data.getModelCategories]', { carId, error: error.message, code: error.code })
    return []
  }
  return (data?.map((r: any) => r.category).filter(Boolean) ?? []) as {
    id: string; name: string; slug: string; description: string | null; icon_ref: string | null; sort_order: number
  }[]
}

export async function getModelParts(carId: string) {
  const { data, error } = await supabase
    .from('car_aftermarket_parts')
    .select('*, category:part_categories(id, name, slug, icon_ref)')
    .eq('car_id', carId)
    .order('sort_order')
  if (error) {
    console.error('[data.getModelParts]', { carId, error: error.message, code: error.code })
    return []
  }
  return data ?? []
}

export async function getModelWheelSpecs(carId: string) {
  const { data, error } = await supabase
    .from('car_wheel_specs')
    .select('*')
    .eq('car_id', carId)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') {
    console.error('[data.getModelWheelSpecs]', { carId, error: error.message, code: error.code })
  }
  return data ?? null
}

export async function getModelGlobalBuilds(carId: string) {
  const { data, error } = await supabase
    .from('car_builds')
    .select('build:global_builds(id, title, slug, description, logo_url, is_published)')
    .eq('car_id', carId)
    .order('sort_order')
  if (error) {
    console.error('[data.getModelGlobalBuilds]', { carId, error: error.message, code: error.code })
    return []
  }
  return (data?.map((r: any) => r.build).filter((b: any) => b?.is_published) ?? []) as {
    id: string; title: string; slug: string; description: string | null; logo_url: string | null
  }[]
}

export async function getModelGlobalGames(carId: string) {
  const { data, error } = await supabase
    .from('car_games')
    .select('game:global_games(id, title, slug, description, logo_url, is_published)')
    .eq('car_id', carId)
    .order('sort_order')
  if (error) {
    console.error('[data.getModelGlobalGames]', { carId, error: error.message, code: error.code })
    return []
  }
  return (data?.map((r: any) => r.game).filter((g: any) => g?.is_published) ?? []) as {
    id: string; title: string; slug: string; description: string | null; logo_url: string | null
  }[]
}

// For public build/game pages — entity + its assigned published models
export async function getGlobalBuildBySlug(slug: string) {
  const { data, error } = await supabase
    .from('global_builds')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) return null
  return data
}

export async function getGlobalGameBySlug(slug: string) {
  const { data, error } = await supabase
    .from('global_games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) return null
  return data
}

export async function getModelsForBuild(buildId: string) {
  const { data, error } = await supabase
    .from('car_builds')
    .select('car:cars(id, title, slug, cover_image, brand, brand_id, is_published, brand_data:brands(name))')
    .eq('build_id', buildId)
  if (error) return []
  const cars = (data?.map((r: any) => r.car).filter((c: any) => c?.is_published) ?? []) as {
    id: string; title: string; slug: string; cover_image: string | null; brand: string | null; brand_data?: { name: string } | null
  }[]
  // Enrich each car with its first gallery photo for cover fallback
  return Promise.all(cars.map(async car => {
    if (car.cover_image) return car
    const { data: photos } = await supabase
      .from('gallery_photos').select('url').eq('car_id', car.id)
      .eq('is_visible', true).order('sort_order').limit(1)
    return { ...car, cover_image: photos?.[0]?.url ?? null }
  }))
}

export async function getModelsForGame(gameId: string) {
  const { data, error } = await supabase
    .from('car_games')
    .select('car:cars(id, title, slug, cover_image, brand, brand_id, is_published, brand_data:brands(name))')
    .eq('game_id', gameId)
  if (error) return []
  const cars = (data?.map((r: any) => r.car).filter((c: any) => c?.is_published) ?? []) as {
    id: string; title: string; slug: string; cover_image: string | null; brand: string | null; brand_data?: { name: string } | null
  }[]
  return Promise.all(cars.map(async car => {
    if (car.cover_image) return car
    const { data: photos } = await supabase
      .from('gallery_photos').select('url').eq('car_id', car.id)
      .eq('is_visible', true).order('sort_order').limit(1)
    return { ...car, cover_image: photos?.[0]?.url ?? null }
  }))
}

// For sitemap — published builds/games with at least one assigned published car
export async function getPublishedGlobalBuilds() {
  const { data } = await supabase
    .from('global_builds')
    .select('slug, created_at')
    .eq('is_published', true)
  return data || []
}

export async function getPublishedGlobalGames() {
  const { data } = await supabase
    .from('global_games')
    .select('slug, created_at')
    .eq('is_published', true)
  return data || []
}

// ── v7 public reads ───────────────────────────────────────────────────────────

export async function getPublishedBuildCategories() {
  const { data, error } = await supabase
    .from('build_categories')
    .select('id, name, slug, description, image_url, icon_ref, sort_order')
    .eq('is_published', true)
    .order('sort_order')
  if (error) { console.error('[data.getPublishedBuildCategories]', error.message); return [] }
  return data || []
}

export async function getBuildCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('build_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) return null
  return data
}

// All gallery photos from models that have a build instance in this category
export async function getPhotosForBuildCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('build_instance_photos')
    .select(`
      photo:gallery_photos(id, url, thumb_url, orientation, car_id, alt_text, caption),
      build:car_build_instances!inner(category_id, car:cars!inner(is_published))
    `)
    .eq('build.category_id', categoryId)
  if (error) { console.error('[data.getPhotosForBuildCategory]', error.message); return [] }
  return (data || [])
    .map((r: any) => r.photo)
    .filter((p: any) => p && p.car_id) as {
      id: string; url: string; thumb_url: string | null; orientation: string; car_id: string; alt_text: string | null; caption: string | null
    }[]
}

export async function getPublishedPartCategories() {
  const { data, error } = await supabase
    .from('part_categories')
    .select('id, name, slug, description, image_url, icon_ref, sort_order')
    .eq('is_published', true)
    .eq('is_active', true)
    .order('sort_order')
  if (error) { console.error('[data.getPublishedPartCategories]', error.message); return [] }
  return data || []
}

export async function getPartCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('part_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) return null
  return data
}

export async function getPartsForCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('car_aftermarket_parts')
    .select('id, name, brand_name, notes, image_url, affiliate_url, price_range, key_specs, availability, is_featured, sort_order')
    .eq('category_id', categoryId)
    .order('sort_order')
  if (error) { console.error('[data.getPartsForCategory]', error.message); return [] }
  return data || []
}

export async function getModelBuildInstances(carId: string) {
  const { data, error } = await supabase
    .from('car_build_instances')
    .select(`
      id, title, setup_summary, category_id, is_visible, sort_order,
      category:build_categories(id, name, slug),
      photos:build_instance_photos(build_id, photo_id, sort_order, photo:gallery_photos(id, url, thumb_url, orientation))
    `)
    .eq('car_id', carId)
    .eq('is_visible', true)
    .order('sort_order')
  if (error) { console.error('[data.getModelBuildInstances]', error.message); return [] }
  return data || []
}
