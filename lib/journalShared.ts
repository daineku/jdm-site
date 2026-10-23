/**
 * Journal types and formatting with no data-access imports, so client components (the admin
 * editor and its preview) can use them without pulling the Supabase client into the bundle.
 */

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  cover_image_url: string | null
  cover_alt: string
  is_published: boolean
  is_featured: boolean
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ArticleCard = Pick<Article, 'id' | 'slug' | 'title' | 'excerpt' | 'category' | 'cover_image_url' | 'cover_alt' | 'is_featured' | 'sort_order' | 'published_at' | 'updated_at'>

/** "12 October 2026" — British order, fixed time zone so server and client agree. */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(new Date(iso))
}

/** Field limits — mirrored by the zod schemas and the table constraints. */
export const ARTICLE_LIMITS = { title: 200, slug: 120, excerpt: 400, body: 100_000, category: 60, coverAlt: 300 } as const

/** Slug suggestion from a title. Not authoritative — the result still goes through articleSlug. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // strip combining accents: "Café" → "cafe"
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ARTICLE_LIMITS.slug)
    .replace(/-+$/g, '')
}
