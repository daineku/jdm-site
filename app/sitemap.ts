import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getBaseUrl } from '@/lib/seo'
import { getPublishedArticles } from '@/lib/journal'

// Built per request so a Journal article appears (or disappears) the moment it is saved in the admin.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  const { data: cars } = await supabase
    .from('cars')
    .select('slug, created_at')
    .eq('is_published', true)

  // Brand filter pages (/archive?brand=slug) are query-param variations of the archive,
  // not canonical routes. They are excluded from the sitemap to avoid crawl budget
  // dilution. When /brand/[slug] pages are built, add them here.

  const { data: buildCatSlugs } = await supabase
    .from('build_categories')
    .select('slug, created_at')
    .eq('is_published', true)

  const { data: partCatSlugs } = await supabase
    .from('part_categories')
    .select('slug, created_at')
    .eq('is_published', true)
    .eq('is_active', true)

  const modelUrls = (cars || []).map(car => ({
    url: `${baseUrl}/cars/${car.slug}`,
    lastModified: car.created_at,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // The JDM feed that used to be the homepage now lives at /archive.
  const archiveUrl       = { url: `${baseUrl}/archive`, lastModified: new Date().toISOString(), changeFrequency: 'daily' as const, priority: 0.7 }
  const buildsListingUrl = { url: `${baseUrl}/builds`, lastModified: new Date().toISOString(), changeFrequency: 'weekly' as const, priority: 0.7 }
  const partsListingUrl  = { url: `${baseUrl}/parts`,  lastModified: new Date().toISOString(), changeFrequency: 'weekly' as const, priority: 0.7 }

  const buildCatUrls = (buildCatSlugs || []).map(b => ({
    url: `${baseUrl}/builds/${b.slug}`,
    lastModified: b.created_at,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const partCatUrls = (partCatSlugs || []).map(p => ({
    url: `${baseUrl}/parts/${p.slug}`,
    lastModified: p.created_at,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const articles = await getPublishedArticles()
  const journalUrls = [
    { url: `${baseUrl}/journal`, lastModified: articles[0]?.published_at ?? new Date().toISOString(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...articles.map(a => ({
      url: `${baseUrl}/journal/${a.slug}`,
      lastModified: a.published_at ?? undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...journalUrls,
    archiveUrl,
    ...modelUrls,
    buildsListingUrl,
    partsListingUrl,
    ...buildCatUrls,
    ...partCatUrls,
  ]
}

