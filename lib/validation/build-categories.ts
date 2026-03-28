import { z } from 'zod'
import { safeSlug, safeImageUrl } from './shared'

export const BuildCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: safeSlug,
  description: z.string().max(500).nullable().optional(),         // short — cards/lists
  page_description: z.string().max(10000).nullable().optional(),  // long — category page intro
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  og_image_url: safeImageUrl.optional(),
  icon_ref: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
})

export const BuildCategoryUpdateSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
  name: z.string().min(1).max(200).optional(),
  slug: safeSlug.optional(),
  description: z.string().max(500).nullable().optional(),
  page_description: z.string().max(10000).nullable().optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  og_image_url: safeImageUrl.optional(),
  icon_ref: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
})

export const BuildCategoryDeleteSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
})

// Per-model assignment
export const CarCategoryAssignSchema = z.object({
  car_id: z.string().uuid(),
  category_ids: z.array(z.string().uuid()).max(20),
})

export type BuildCategoryCreatePayload = z.infer<typeof BuildCategoryCreateSchema>
export type BuildCategoryUpdatePayload = z.infer<typeof BuildCategoryUpdateSchema>
