import { z } from 'zod'
import { safeImageUrl } from './shared'

const KeySpecPair = z.object({
  label: z.string().min(1).max(50),
  value: z.string().min(1).max(100),
})

const partFields = {
  part_category_id: z.string().uuid().nullable().optional(),
  brand_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  image_url: safeImageUrl.optional(),
  affiliate_url: z.string().url().max(2000).nullable().optional(),
  price_range: z.string().max(100).nullable().optional(),
  key_specs: z.array(KeySpecPair).max(8).default([]),
  availability: z.enum(['in_stock', 'limited', 'discontinued']).nullable().optional(),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
}

export const GlobalPartCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  ...partFields,
})

export const GlobalPartUpdateSchema = z.object({
  id: z.string().uuid('Invalid part ID'),
  title: z.string().min(1).max(300).optional(),
  ...partFields,
})

export const GlobalPartDeleteSchema = z.object({
  id: z.string().uuid('Invalid part ID'),
})

export const ModelPartAssignSchema = z.object({
  car_id: z.string().uuid(),
  part_id: z.string().uuid(),
})

export type GlobalPartCreatePayload = z.infer<typeof GlobalPartCreateSchema>
