import { z } from 'zod'
import { safeImageUrl } from './shared'

const KeySpecPair = z.object({
  label: z.string().min(1).max(50),
  value: z.string().min(1).max(100),
})

const productFields = {
  image_url: safeImageUrl.optional(),
  affiliate_url: z.string().url().max(2000).nullable().optional(),
  price_range: z.string().max(100).nullable().optional(),
  key_specs: z.array(KeySpecPair).max(8).default([]),
  availability: z.enum(['in_stock', 'limited', 'discontinued']).nullable().optional(),
  is_featured: z.boolean().default(false),
}

export const AftermarketPartCreateSchema = z.object({
  car_id: z.string().uuid('Invalid car ID'),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(300),
  brand_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  ...productFields,
})

export const AftermarketPartUpdateSchema = z.object({
  id: z.string().uuid('Invalid part ID'),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(300).optional(),
  brand_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  ...productFields,
})

export const AftermarketPartDeleteSchema = z.object({
  id: z.string().uuid('Invalid part ID'),
})

export type AftermarketPartCreatePayload = z.infer<typeof AftermarketPartCreateSchema>
