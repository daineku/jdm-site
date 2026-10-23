import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { LEGAL_UPDATED, getBaseUrl, isLegacyArchiveIndexable } from '@/lib/seo'
import { getPublishedArticles } from '@/lib/journal'

// Built per request so an article published (or unpublished) in the admin is reflected on the
// next fetch. The read behind it is held in the data cache and purged by the admin API
// (lib/journal.ts), so a sitemap request normally costs no database query.
export const dynamic = 'force-dynamic'

/** The newest ISO timestamp in a list, or undefined when there is none. */
function newest(dates: (string | null | undefined)[]): string | undefined {
  const valid = dates.filter((d): d is string => !!d && !Number.isNaN(Date.parse(d)))
  return valid.length ? valid.sort((a, b) => Date.parse(b) - Date.parse(a))[0] : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const articles = await getPublishedArticles()

  // Timestamps are real modification dates only. The homepage carries none: it changes with code
  // deploys, which leave no content timestamp, and a fake "now" on every request would be ignored.
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
  ]

  // The Articles index is listed once there is something to read; an empty index is noindex.
  if (articles.length > 0) {
    entries.push({
      url: `${base}/journal`,
      lastModified: newest(articles.map(a => a.updated_at ?? a.published_at)),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    for (const a of articles) {
      entries.push({
        url: `${base}/journal/${a.slug}`,
        lastModified: a.updated_at ?? a.published_at ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  entries.push(
    { url: `${base}/privacy`, lastModified: LEGAL_UPDATED.privacy, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: LEGAL_UPDATED.terms, changeFrequency: 'yearly', priority: 0.3 },
  )

  // Legacy automotive archive: kept out of the studio sitemap unless the owner opts back in
  // (LEGACY_ARCHIVE_INDEXABLE=true, see lib/seo.ts). The routes themselves stay live either way.
  if (isLegacyArchiveIndexable()) {
    const [{ data: cars }, { data: buildCats }, { data: partCats }] = await Promise.all([
      supabase.from('cars').select('slug, created_at').eq('is_published', true),
      supabase.from('build_categories').select('slug, created_at').eq('is_published', true),
      supabase.from('part_categories').select('slug, created_at').eq('is_published', true).eq('is_active', true),
    ])
    entries.push(
      { url: `${base}/archive`, changeFrequency: 'monthly', priority: 0.4 },
      ...(cars ?? []).map(c => ({ url: `${base}/cars/${c.slug}`, lastModified: c.created_at as string, changeFrequency: 'yearly' as const, priority: 0.4 })),
      { url: `${base}/builds`, changeFrequency: 'monthly', priority: 0.3 },
      ...(buildCats ?? []).map(b => ({ url: `${base}/builds/${b.slug}`, lastModified: b.created_at as string, changeFrequency: 'yearly' as const, priority: 0.3 })),
      { url: `${base}/parts`, changeFrequency: 'monthly', priority: 0.3 },
      ...(partCats ?? []).map(p => ({ url: `${base}/parts/${p.slug}`, lastModified: p.created_at as string, changeFrequency: 'yearly' as const, priority: 0.3 })),
    )
  }

  return entries
}
