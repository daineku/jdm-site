import { z } from 'zod'
import { safeSlug, safeImageUrl } from './shared'

const seoFields = {
  description: z.string().max(500).nullable().optional(),
  page_description: z.string().max(10000).nullable().optional(),
  image_url: safeImageUrl.optional(),
  og_image_url: safeImageUrl.optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  is_published: z.boolean().optional(),
}

export const PartCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: safeSlug,
  icon_ref: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  ...seoFields,
})

export const PartCategoryUpdateSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
  name: z.string().min(1).max(200).optional(),
  slug: safeSlug.optional(),
  icon_ref: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  ...seoFields,
})

export const PartCategoryDeleteSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
})

export type PartCategoryCreatePayload = z.infer<typeof PartCategoryCreateSchema>
