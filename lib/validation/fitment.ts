import { z } from 'zod'

// Predefined option sets — validated as enum-like but stored as text for flexibility
const fitmentStyle = z.enum(['flush', 'poke', 'stance', 'tucked', '']).nullable().optional()
const rideHeight   = z.enum(['slammed', 'low', 'daily', 'stock', '']).nullable().optional()
const camberLook   = z.enum(['aggressive', 'slight', 'zero', '']).nullable().optional()

export const CarFitmentUpsertSchema = z.object({
  car_id: z.string().uuid('Invalid car ID'),

  fitment_style:        fitmentStyle,
  ride_height:          rideHeight,
  camber_look:          camberLook,
  best_wheel_style:     z.string().max(100).nullable().optional(),
  best_diameter:        z.string().max(20).nullable().optional(),
  observed_rim_guess:   z.string().max(200).nullable().optional(),
  popular_rim_option_1: z.string().max(200).nullable().optional(),
  popular_rim_option_2: z.string().max(200).nullable().optional(),
  editorial_summary:    z.string().max(5000).nullable().optional(),
  is_visible:           z.boolean().optional(),
})

export type CarFitmentUpsertPayload = z.infer<typeof CarFitmentUpsertSchema>
