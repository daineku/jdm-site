import type { SiteSettings } from './types'

/**
 * Support module (Patreon) — an optional, owner-configured block inviting visitors to support
 * the development of a studio project. It is a native DAINEKU-designed block that links out to
 * a verified Patreon destination.
 *
 * Why there is no embedded mode: Patreon publishes no official embeddable widget, iframe or
 * oEmbed endpoint for creator pages or posts (checked October 2026 — docs.patreon.com covers
 * OAuth, the REST API and webhooks only; post embeds inside Patreon run through Embed.ly in the
 * other direction, and the old "Become a patron" button is a third-party script). Loading
 * patreon.com in an iframe is blocked by its frame headers. So the module never injects
 * third-party script or frames; it is a styled link.
 *
 * Configuration, in order of precedence:
 *   1. site_settings (admin → Site Settings → Support module) once migration_v11a is applied.
 *      When the row carries the support columns, they decide — including "disabled".
 *   2. Otherwise environment: PATREON_URL (+ optional SUPPORT_TITLE, SUPPORT_BODY, SUPPORT_CTA,
 *      SUPPORT_PROJECT, SUPPORT_PLACEMENT, SUPPORT_IMAGE_URL, SUPPORT_IMAGE_ALT).
 * With neither, the module is disabled and nothing about it reaches the page.
 */

export type SupportPlacement = 'project' | 'home'

export type SupportConfig = {
  provider: 'patreon'
  url: string
  title: string
  body: string
  cta: string
  imageUrl: string | null
  imageAlt: string
  /** Slug of the project the support is for (lib/projects.ts), or null. */
  project: string | null
  placement: SupportPlacement
}

export const SUPPORT_LIMITS = { title: 120, body: 400, cta: 40, imageAlt: 200, project: 60 } as const

export const SUPPORT_DEFAULTS = {
  title: 'Support the development',
  body: 'The studio’s original projects are developed independently. Patreon support goes directly into their continued production.',
  cta: 'Support development',
  placement: 'project' as SupportPlacement,
}

const PATREON_HOSTS = new Set(['patreon.com', 'www.patreon.com'])
const PATREON_PATH = /^\/(?:(?:c|cw|join|checkout)\/)?[A-Za-z0-9_.-]{1,100}\/?$/

/** True only for a creator / membership page on patreon.com: https, no credentials, query or fragment. */
export function isSupportUrl(value: string): boolean {
  let u: URL
  try { u = new URL(value) } catch { return false }
  if (u.protocol !== 'https:' || !PATREON_HOSTS.has(u.hostname)) return false
  if (u.username || u.password || u.search || u.hash || u.port) return false
  return PATREON_PATH.test(u.pathname)
}

export function isSupportPlacement(v: unknown): v is SupportPlacement {
  return v === 'project' || v === 'home'
}

type SupportFields = Pick<SiteSettings,
  'support_enabled' | 'support_url' | 'support_title' | 'support_body' | 'support_cta' | 'support_image_url' | 'support_image_alt' | 'support_project' | 'support_placement'>

const clean = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().replace(/[\r\n]+/g, ' ').slice(0, max) : '')

function build(src: { url: unknown; title?: unknown; body?: unknown; cta?: unknown; imageUrl?: unknown; imageAlt?: unknown; project?: unknown; placement?: unknown }): SupportConfig | null {
  const url = clean(src.url, 300)
  if (!isSupportUrl(url)) return null
  const imageUrl = clean(src.imageUrl, 500)
  const project = clean(src.project, SUPPORT_LIMITS.project)
  return {
    provider: 'patreon',
    url,
    title: clean(src.title, SUPPORT_LIMITS.title) || SUPPORT_DEFAULTS.title,
    body: clean(src.body, SUPPORT_LIMITS.body) || SUPPORT_DEFAULTS.body,
    cta: clean(src.cta, SUPPORT_LIMITS.cta) || SUPPORT_DEFAULTS.cta,
    imageUrl: /^https:\/\//.test(imageUrl) ? imageUrl : null,
    imageAlt: clean(src.imageAlt, SUPPORT_LIMITS.imageAlt),
    project: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(project) ? project : null,
    placement: isSupportPlacement(src.placement) ? src.placement : SUPPORT_DEFAULTS.placement,
  }
}

/** The active configuration, or null when the module is disabled or misconfigured. */
export function resolveSupport(settings: Partial<SupportFields> | null, env: Record<string, string | undefined> = process.env): SupportConfig | null {
  // The settings row knows about the module (migration applied) → it is the only authority.
  if (settings && settings.support_enabled !== undefined && settings.support_enabled !== null) {
    if (!settings.support_enabled) return null
    return build({
      url: settings.support_url, title: settings.support_title, body: settings.support_body, cta: settings.support_cta,
      imageUrl: settings.support_image_url, imageAlt: settings.support_image_alt, project: settings.support_project, placement: settings.support_placement,
    })
  }
  if (!env.PATREON_URL?.trim()) return null
  return build({
    url: env.PATREON_URL, title: env.SUPPORT_TITLE, body: env.SUPPORT_BODY, cta: env.SUPPORT_CTA,
    imageUrl: env.SUPPORT_IMAGE_URL, imageAlt: env.SUPPORT_IMAGE_ALT, project: env.SUPPORT_PROJECT, placement: env.SUPPORT_PLACEMENT,
  })
}
