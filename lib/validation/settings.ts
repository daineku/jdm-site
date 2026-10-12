import { z } from 'zod'
import { safeImageUrl, safeSocialUrl } from './shared'
import { SUPPORT_LIMITS, isSupportUrl } from '../support.ts'

/** Support module fields (migration_v11a). All optional so older admin payloads still validate. */
const supportFields = {
  support_enabled: z.boolean().optional(),
  support_url: z.string().trim().max(300)
    .refine(u => u === '' || isSupportUrl(u), 'Support URL must be a creator page on patreon.com (https://www.patreon.com/…), without query or fragment')
    .nullable().optional(),
  support_title: z.string().trim().max(SUPPORT_LIMITS.title).nullable().optional(),
  support_body: z.string().trim().max(SUPPORT_LIMITS.body).nullable().optional(),
  support_cta: z.string().trim().max(SUPPORT_LIMITS.cta).nullable().optional(),
  support_image_url: safeImageUrl.optional(),
  support_image_alt: z.string().trim().max(SUPPORT_LIMITS.imageAlt).nullable().optional(),
  support_project: z.string().trim().max(SUPPORT_LIMITS.project).regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, 'Project must be a slug').nullable().optional(),
  support_placement: z.enum(['project', 'home']).optional(),
}

export const SiteSettingsUpdateSchema = z.object({
  ...supportFields,
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
