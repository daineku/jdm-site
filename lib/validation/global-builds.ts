import { z } from 'zod'
import { safeSlug, safeImageUrl } from './shared'

export const GlobalBuildCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: safeSlug,
  description: z.string().max(500).nullable().optional(),
  page_description: z.string().max(10000).nullable().optional(),
  logo_url: safeImageUrl.optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  og_image_url: safeImageUrl.optional(),
  sort_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
})

export const GlobalBuildUpdateSchema = z.object({
  id: z.string().uuid('Invalid build ID'),
  title: z.string().min(1).max(200).optional(),
  slug: safeSlug.optional(),
  description: z.string().max(500).nullable().optional(),
  page_description: z.string().max(10000).nullable().optional(),
  logo_url: safeImageUrl.optional(),
  seo_title: z.string().max(200).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  og_image_url: safeImageUrl.optional(),
  sort_order: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
})

export const GlobalBuildDeleteSchema = z.object({
  id: z.string().uuid('Invalid build ID'),
})

// Per-model assignment
export const CarBuildAssignSchema = z.object({
  car_id: z.string().uuid(),
  build_id: z.string().uuid(),
})

export type GlobalBuildCreatePayload = z.infer<typeof GlobalBuildCreateSchema>
