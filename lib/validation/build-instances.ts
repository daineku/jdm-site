import { z } from 'zod'
import { safeImageUrl } from './shared'

const wheelField = z.string().max(50).nullable().optional()

export const BuildInstanceCreateSchema = z.object({
  car_id: z.string().uuid(),
  category_id: z.string().uuid('A Build Category is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  setup_summary: z.string().min(1, 'Setup summary is required').max(300),
  // Wheel setup
  wheel_brand: wheelField,
  wheel_model: wheelField,
  wheel_size_front: wheelField,
  wheel_size_rear: wheelField,
  offset_front: wheelField,
  offset_rear: wheelField,
  tire_front: wheelField,
  tire_rear: wheelField,
  sort_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
})

export const BuildInstanceUpdateSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid('A Build Category is required').optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  setup_summary: z.string().min(1).max(300).optional(),
  wheel_brand: wheelField,
  wheel_model: wheelField,
  wheel_size_front: wheelField,
  wheel_size_rear: wheelField,
  offset_front: wheelField,
  offset_rear: wheelField,
  tire_front: wheelField,
  tire_rear: wheelField,
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
})

export const BuildInstanceDeleteSchema = z.object({
  id: z.string().uuid(),
})

export const BuildInstancePhotoAssignSchema = z.object({
  build_id: z.string().uuid(),
  photo_id: z.string().uuid(),
  sort_order: z.number().int().min(0).default(0),
})

export const BuildInstancePhotoRemoveSchema = z.object({
  build_id: z.string().uuid(),
  photo_id: z.string().uuid(),
})
