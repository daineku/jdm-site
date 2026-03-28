import { z } from 'zod'
import { safeSlug, safeImageUrl } from './shared'

export const CarCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: safeSlug,
  description: z.string().max(10000).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  brand: z.string().max(200).nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  cover_image: safeImageUrl.optional(),
  sort_order: z.number().int().min(0).default(0),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
})

export const CarUpdateSchema = z.object({
  id: z.string().uuid('Invalid car ID'),
  title: z.string().min(1).max(200).optional(),
  slug: safeSlug.optional(),
  description: z.string().max(10000).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  brand: z.string().max(200).nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  cover_image: safeImageUrl.optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
})

export const CarDeleteSchema = z.object({
  id: z.string().uuid('Invalid car ID'),
})

export type CarCreatePayload = z.infer<typeof CarCreateSchema>
export type CarUpdatePayload = z.infer<typeof CarUpdateSchema>
