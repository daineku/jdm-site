import { z } from 'zod'
import { ARTICLE_LIMITS } from '../journalShared.ts'

export { ARTICLE_LIMITS, slugify } from '../journalShared.ts'

/**
 * Studio Journal article payloads (admin API). The table constraints in
 * supabase/migration_v10a_studio_articles.sql mirror these limits, so the database
 * rejects anything that slips past the API.
 */

export const articleSlug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(ARTICLE_LIMITS.slug, `Slug must be ${ARTICLE_LIMITS.slug} characters or less`)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug: lowercase letters, digits and single hyphens only (e.g. building-a-night-expressway)')

const coverUrl = z
  .string()
  .trim()
  .url('Cover image must be a valid URL')
  .refine(u => {
    // Uploaded media lives on the R2 public origin (server config, HTTPS in production);
    // refuse anything else. Without that config, require HTTPS — the table enforces it too.
    const base = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '')
    return base ? u.startsWith(`${base}/`) : u.startsWith('https://')
  }, 'Cover image must be uploaded to, or selected from, the site media library')

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(ARTICLE_LIMITS.title),
  slug: articleSlug,
  excerpt: z.string().trim().max(ARTICLE_LIMITS.excerpt, `Excerpt must be ${ARTICLE_LIMITS.excerpt} characters or less`),
  body: z.string().max(ARTICLE_LIMITS.body),
  category: z.string().trim().max(ARTICLE_LIMITS.category),
  cover_image_url: coverUrl.nullable(),
  cover_alt: z.string().trim().max(ARTICLE_LIMITS.coverAlt),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
  published_at: z.iso.datetime({ offset: true }).nullable(),
}

type Draft = { title?: string; excerpt?: string; body?: string; cover_image_url?: string | null; cover_alt?: string; is_published?: boolean }

/** Rules that depend on more than one field. Applied to the merged row on update. */
export function publicationProblem(a: Draft): string | null {
  if (a.cover_image_url && !a.cover_alt?.trim()) return 'Describe the cover image (alt text) — it is read out to screen-reader users.'
  if (a.is_published) {
    if (!a.excerpt?.trim()) return 'An excerpt is required before publishing.'
    if (!a.body?.trim()) return 'The article body is empty — add content before publishing.'
  }
  return null
}

export const ArticleCreateSchema = z.object({
  ...fields,
  excerpt: fields.excerpt.default(''),
  body: fields.body.default(''),
  category: fields.category.default(''),
  cover_image_url: fields.cover_image_url.default(null),
  cover_alt: fields.cover_alt.default(''),
  is_published: fields.is_published.default(false),
  is_featured: fields.is_featured.default(false),
  sort_order: fields.sort_order.default(0),
  published_at: fields.published_at.default(null),
}).strict()

export const ArticleUpdateSchema = z.object({
  id: z.uuid('Invalid article id'),
  ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])) as {
    [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]>
  },
}).strict()

export const ArticleDeleteSchema = z.object({ id: z.uuid('Invalid article id') }).strict()

/** Featured order: the ids in display order. */
export const ArticleOrderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(100) }).strict()

export type ArticleCreatePayload = z.infer<typeof ArticleCreateSchema>
export type ArticleUpdatePayload = z.infer<typeof ArticleUpdateSchema>
