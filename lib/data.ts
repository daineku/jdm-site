import { supabase } from './supabase'
import type { Model, GalleryPhoto, Brand, SiteSettings, BuildCategory, CarFitment, CarSpecs, AftermarketPart } from './types'

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

// ── v5: Build categories, fitment, specs, aftermarket parts ──

export async function getModelBuildCategories(carId: string): Promise<BuildCategory[]> {
  const { data } = await supabase
    .from('car_build_categories')
    .select('build_categories(*)')
    .eq('car_id', carId)
  if (!data) return []
  return data
    .map((row: any) => row.build_categories)
    .filter(Boolean)
    .sort((a: BuildCategory, b: BuildCategory) => a.sort_order - b.sort_order)
}

export async function getModelFitment(carId: string): Promise<CarFitment | null> {
  const { data } = await supabase
    .from('car_fitment')
    .select('*')
    .eq('car_id', carId)
    .eq('is_visible', true)
    .maybeSingle()
  return data
}

export async function getModelSpecs(carId: string): Promise<CarSpecs | null> {
  const { data } = await supabase
    .from('car_specs')
    .select('*')
    .eq('car_id', carId)
    .eq('is_visible', true)
    .maybeSingle()
  return data
}

export async function getModelAftermarketParts(carId: string): Promise<AftermarketPart[]> {
  const { data } = await supabase
    .from('car_aftermarket_parts')
    .select('*')
    .eq('car_id', carId)
    .eq('is_hidden', false)
    .order('sort_order')
  return data || []
}
