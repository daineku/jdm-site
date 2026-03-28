import { z } from 'zod'

// ── Reserved slugs ────────────────────────────────────────────────────────────
// These are application route paths that must not be used as entity slugs.
const RESERVED_SLUGS = new Set([
  'api', 'admin', '_next', 'static', 'public', 'favicon',
  'sitemap', 'robots', 'cars', 'brand', 'category', 'builds',
  'guides', 'search', 'login', 'logout', 'dashboard',
])

export const safeSlug = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must be 200 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
  .refine(s => !s.startsWith('-') && !s.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  })
  .refine(s => !RESERVED_SLUGS.has(s), {
    message: 'This slug is reserved by the application',
  })

// ── Social URL allowlist ──────────────────────────────────────────────────────
const ALLOWED_SOCIAL = [
  /^https:\/\/(www\.)?tiktok\.com\//,
  /^https:\/\/(www\.)?youtube\.com\//,
  /^https:\/\/(www\.)?instagram\.com\//,
]

export const safeSocialUrl = z
  .string()
  .refine(
    url => url === '' || ALLOWED_SOCIAL.some(re => re.test(url)),
    { message: 'Social URL must be from TikTok, YouTube, or Instagram' }
  )
  .or(z.literal(''))
  .nullable()

// ── TikTok embed URL ──────────────────────────────────────────────────────────
export const safeTikTokUrl = z
  .string()
  .url('Must be a valid URL')
  .refine(
    url => /^https:\/\/(www\.)?tiktok\.com\//.test(url),
    { message: 'Embed URL must be from TikTok' }
  )

// ── HTTPS-only image URL ──────────────────────────────────────────────────────
// For this project: any HTTPS URL is acceptable for image fields.
// Future hardening: restrict to R2/Supabase domains when upload pipeline is stable.
export const safeImageUrl = z
  .string()
  .url('Must be a valid URL')
  .refine(url => url.startsWith('https://'), { message: 'Image URL must use HTTPS' })
  .nullable()
