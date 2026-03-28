import { z } from 'zod'
import { safeImageUrl, safeSocialUrl } from './shared'

export const SiteSettingsUpdateSchema = z.object({
  id: z.string().uuid('Invalid settings ID'),
  site_title: z.string().min(1, 'Site title is required').max(200),
  logo_url: safeImageUrl.optional(),
  tiktok_url: safeSocialUrl,
  youtube_url: safeSocialUrl,
  instagram_url: safeSocialUrl,
  nav_links: z.array(
    z.object({
      label: z.string().min(1).max(100),
      href: z.string().min(1).max(500),
    })
  ).max(20, 'Maximum 20 nav links'),
  // SEO content defaults
  default_seo_description: z.string().max(500).nullable().optional(),
  default_og_image: safeImageUrl.optional(),
  // Integrations (migration_v6c)
  ga4_measurement_id: z.string().regex(/^G-[A-Z0-9]{4,20}$/, 'Must be a valid GA4 Measurement ID (G-XXXXXXXXXX)').nullable().optional(),
  search_console_verification: z.string().max(200).regex(/^[a-zA-Z0-9_-]*$/, 'Only alphanumeric characters, hyphens and underscores allowed').nullable().optional(),
  favicon_url: safeImageUrl.optional(),
})

export type SiteSettingsUpdatePayload = z.infer<typeof SiteSettingsUpdateSchema>
