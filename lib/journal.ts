import { cache } from 'react'
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
 * Reads are wrapped in React's per-request cache: the homepage, its metadata and the
 * sitemap can each ask for the list and only one query is made per request.
 */

const CARD_COLUMNS = 'id, slug, title, excerpt, category, cover_image_url, cover_alt, is_featured, sort_order, published_at'
export const TABLE = 'studio_articles'

let warned = false
function report(error: { message?: string; code?: string } | null) {
  if (error && !warned) {
    warned = true
    console.warn(`[journal] ${TABLE} unavailable (${error.code ?? 'error'}): the Journal is hidden until the migration is applied.`)
  }
}

/** All published articles, newest first. */
export const getPublishedArticles = cache(async (): Promise<ArticleCard[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(CARD_COLUMNS)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(200)
  report(error)
  return (data as ArticleCard[] | null) ?? []
})

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

export const getPublishedArticle = cache(async (slug: string): Promise<Article | null> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()
  report(error)
  return (data as Article | null) ?? null
})
