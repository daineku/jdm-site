/**
 * SEO resolution utilities — cascading fallback for all page types.
 *
 * SOURCE OF TRUTH RULES:
 *   Base URL / canonical domain → NEXT_PUBLIC_SITE_URL env var (never DB)
 *   SEO content defaults        → site_settings DB row (default_seo_description, default_og_image)
 *   Per-entity overrides        → entity row (seo_title, seo_description, cover_image / og_image_url)
 *
 * FALLBACK CHAINS:
 *   title:       seo_title → entity name → site_settings.site_title → 'DAINEKU'
 *   description: seo_description → entity description (≤160 chars) → default_seo_description → undefined
 *   og image:    page override → entity image → default_og_image → []
 *
 * ALT TEXT (for images, not metadata):
 *   photo.alt_text → photo.caption → model/context title fallback → safe generic → never ''
 */

import type { SiteSettings } from './types'

/**
 * Studio positioning. The homepage title, and the default title/description for every studio
 * page that does not set its own. Fixed in code on purpose: the legacy JDM site_settings SEO
 * defaults (default_seo_description etc.) must never reach the studio pages.
 */
export const STUDIO_TITLE = 'DAINEKU | Creative Technology & Simulation Studio'
export const STUDIO_DESCRIPTION =
  'DAINEKU is a creative technology studio developing real-time simulations, interactive 3D experiences and cinematic digital environments.'

/** The single canonical base URL for this deployment. Never use DB for this. */
export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://daineku.com').replace(/\/$/, '')
}

type Env = Record<string, string | undefined>

/**
 * Production = the Vercel production deployment, or a plain `next start` with no VERCEL_ENV
 * (local builds and the smoke suite). Previews and branch deployments are never indexable:
 * the root layout emits noindex, robots.txt disallows everything, and Vercel additionally sends
 * `X-Robots-Tag: noindex` on every non-production deployment.
 */
export function isProductionDeployment(env: Env = process.env): boolean {
  return env.VERCEL_ENV === undefined || env.VERCEL_ENV === 'production'
}

/**
 * robots.txt rules. Production: everything crawlable except the API; `/_next/` is NOT blocked —
 * Google must fetch the JavaScript, CSS and optimised images under it to render the pages. The
 * admin path is secret and is not listed here (listing it would publish it); it is noindexed by
 * its own metadata instead. Non-production: nothing crawlable and no sitemap.
 */
export function robotsRules(production: boolean, baseUrl: string): {
  rules: { userAgent: string; allow?: string; disallow?: string | string[] }[]
  sitemap?: string
} {
  if (!production) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

/** Dates the legal documents last changed. Also used by the sitemap, so the two cannot drift. */
export const LEGAL_UPDATED = { privacy: '2026-10-13', terms: '2026-10-13' } as const

/**
 * Legacy automotive archive (/archive, /cars, /builds, /parts). The routes and their database
 * stay intact and keep answering 200, but they are no longer part of the studio's positioning:
 * by default they are `noindex, follow` and absent from the sitemap. Set
 * LEGACY_ARCHIVE_INDEXABLE=true to make them indexable again (and listed in the sitemap) if
 * Search Console shows they still earn traffic worth keeping.
 */
export function isLegacyArchiveIndexable(env: Env = process.env): boolean {
  return env.LEGACY_ARCHIVE_INDEXABLE === 'true'
}

/** Robots directive for a legacy archive page; `undefined` inherits the site default (indexable). */
export function legacyRobots(env: Env = process.env): { index: false; follow: true } | undefined {
  return isLegacyArchiveIndexable(env) ? undefined : { index: false, follow: true }
}

/** Truncate a string to ≤ maxLen chars, ending at a word boundary where possible. */
function truncate(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > maxLen - 30 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function resolveSeoTitle(
  pageOverride: string | null | undefined,
  entityName: string,
  settings: SiteSettings | null,
): string {
  return pageOverride?.trim() || entityName || settings?.site_title || 'DAINEKU'
}

export function resolveSeoDescription(
  pageOverride: string | null | undefined,
  entityDescription: string | null | undefined,
  settings: SiteSettings | null,
): string | undefined {
  const raw =
    pageOverride?.trim() ||
    entityDescription?.trim() ||
    settings?.default_seo_description?.trim() ||
    undefined
  return raw ? truncate(raw, 160) : undefined
}

export function resolveOgImages(
  pageImageOverride: string | null | undefined,
  entityImage: string | null | undefined,
  settings?: SiteSettings | null,
): string[] {
  const img = pageImageOverride || entityImage || settings?.default_og_image || null
  return img ? [img] : []
}

/**
 * Alt text fallback for contextual images (photos of cars, editorial images).
 * Never returns '' — empty string tells screen readers the image is decorative.
 * Car photos on an automotive archive are informational, not decorative.
 *
 *   1. explicit alt_text (set by admin)
 *   2. caption (set by admin, may be descriptive)
 *   3. context title (e.g. model name + ' photo')
 *   4. safe generic fallback
 */
export function resolvePhotoAlt(
  altText: string | null | undefined,
  caption: string | null | undefined,
  contextTitle: string | null | undefined,
  genericFallback = 'JDM car photo',
): string {
  return (
    altText?.trim() ||
    caption?.trim() ||
    (contextTitle?.trim() ? `${contextTitle.trim()} — photo` : null) ||
    genericFallback
  )
}
