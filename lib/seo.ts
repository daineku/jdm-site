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

/** The single canonical base URL for this deployment. Never use DB for this. */
export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://daineku.com').replace(/\/$/, '')
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
