import { z } from 'zod'

// Wheel size: e.g. "16x6.5", "18x9.5", or empty
const wheelSize = z.string().max(20).nullable().optional()
// Offset: e.g. "+45", "-5", "0"
const offset = z.string().max(10).nullable().optional()
// Tire: e.g. "205/55R16", "225/40R18"
const tire = z.string().max(30).nullable().optional()

export const CarWheelSpecsUpsertSchema = z.object({
  car_id: z.string().uuid('Invalid car ID'),

  // OEM
  oem_wheel_size_front: wheelSize,
  oem_wheel_size_rear: wheelSize,
  oem_offset_front: offset,
  oem_offset_rear: offset,
  oem_tire_front: tire,
  oem_tire_rear: tire,
  oem_notes: z.string().max(500).nullable().optional(),

  // Aftermarket
  am_wheel_brand: z.string().max(100).nullable().optional(),
  am_wheel_model: z.string().max(100).nullable().optional(),
  am_wheel_size_front: wheelSize,
  am_wheel_size_rear: wheelSize,
  am_offset_front: offset,
  am_offset_rear: offset,
  am_tire_front: tire,
  am_tire_rear: tire,
  am_notes: z.string().max(500).nullable().optional(),
})

export type CarWheelSpecsUpsertPayload = z.infer<typeof CarWheelSpecsUpsertSchema>
