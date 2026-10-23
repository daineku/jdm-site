import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { supabase } from './supabase'
import type { Article, ArticleCard } from './journalShared'

export type { Article, ArticleCard } from './journalShared'
export { formatArticleDate } from './journalShared'

/**
 * Studio Journal — public reads. Uses the anon client: the table's RLS policy only
 * exposes published rows whose publication time has passed, and the filters below
 * repeat that rule so a misconfigured policy cannot leak a draft.
 *
 * If the table does not exist yet (migration not applied), every read returns empty
 * and the Journal stays hidden — the rest of the site is unaffected.
 *
 * Reads sit in the Next.js data cache (tag JOURNAL_TAG, five minutes) and are purged by the
 * admin journal API on every write, so publishing is reflected on the next request while a
 * normal page, feed or sitemap request costs no database query. React's per-request cache()
 * dedupes the remaining calls within one request. An article scheduled by `published_at`
 * alone (no admin write at that moment) appears within the five-minute window.
 */

const CARD_COLUMNS = 'id, slug, title, excerpt, category, cover_image_url, cover_alt, is_featured, sort_order, published_at, updated_at'
export const TABLE = 'studio_articles'
/** Data-cache tag covering every public journal read. */
export const JOURNAL_TAG = 'journal'

let warned = false
function report(error: { message?: string; code?: string } | null) {
  if (error && !warned) {
    warned = true
    console.warn(`[journal] ${TABLE} unavailable (${error.code ?? 'error'}): the Journal is hidden until the migration is applied.`)
  }
}

/** All published articles, newest first. */
export const getPublishedArticles = cache(unstable_cache(
  async (): Promise<ArticleCard[]> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select(CARD_COLUMNS)
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(200)
    report(error)
    return (data as ArticleCard[] | null) ?? []
  },
  ['journal-published'],
  { tags: [JOURNAL_TAG], revalidate: 300 },
))

/** Featured articles first, in the order set in the admin, then the most recent of the rest. */
export function editorialOrder(all: ArticleCard[]): ArticleCard[] {
  const featured = all.filter(a => a.is_featured).sort((a, b) => a.sort_order - b.sort_order)
  const rest = all.filter(a => !a.is_featured)
  return [...featured, ...rest]
}

/**
 * Up to `limit` articles for the homepage: the first is the featured story, the rest the
 * "latest" list. Four by default — one lead plus three supporting pieces.
 */
export async function getHomepageArticles(limit = 4): Promise<ArticleCard[]> {
  return editorialOrder(await getPublishedArticles()).slice(0, limit)
}

const readPublishedArticle = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .maybeSingle()
    report(error)
    return (data as Article | null) ?? null
  },
  ['journal-article'],
  { tags: [JOURNAL_TAG], revalidate: 300 },
)

export const getPublishedArticle = cache(async (slug: string): Promise<Article | null> => {
  // Malformed slugs never reach the database or the cache.
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  return readPublishedArticle(slug)
})
