import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://daineku.com'

  const { data: cars } = await supabase
    .from('cars')
    .select('slug, created_at')
    .eq('is_published', true)

  const { data: brands } = await supabase
    .from('brands')
    .select('slug')
    .eq('is_visible', true)

  const modelUrls = (cars || []).map(car => ({
    url: `${baseUrl}/cars/${car.slug}`,
    lastModified: car.created_at,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const brandUrls = (brands || []).map(brand => ({
    url: `${baseUrl}/?brand=${brand.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    ...brandUrls,
    ...modelUrls,
  ]
}
