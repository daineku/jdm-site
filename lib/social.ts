import { isEmail } from './contact'
import type { SiteSettings } from './types'

export type SocialKey = 'instagram' | 'youtube' | 'tiktok'

export type SocialLink = {
  key: SocialKey
  label: string
  href: string
}

const SOCIALS: { key: SocialKey; label: string; field: 'instagram_url' | 'youtube_url' | 'tiktok_url' }[] = [
  { key: 'instagram', label: 'Instagram', field: 'instagram_url' },
  { key: 'youtube',   label: 'YouTube',   field: 'youtube_url' },
  { key: 'tiktok',    label: 'TikTok',    field: 'tiktok_url' },
]

/**
 * Social links that are actually configured in site_settings.
 * Only absolute http(s) URLs are returned — an empty or malformed field
 * produces no link rather than a dead one.
 */
export function getSocialLinks(settings: SiteSettings | null): SocialLink[] {
  if (!settings) return []
  return SOCIALS.flatMap(({ key, label, field }) => {
    const href = settings[field]?.trim()
    return href && /^https?:\/\//i.test(href) ? [{ key, label, href }] : []
  })
}

/**
 * Public studio address, shown on the homepage and used as the mailto fallback.
 * Read on the server at request time from CONTACT_EMAIL (NEXT_PUBLIC_CONTACT_EMAIL is
 * still honoured for older configs). No address is ever invented: unset or implausible → null.
 */
export function getContactEmail(): string | null {
  const email = (process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL)?.trim()
  return email && isEmail(email) ? email : null
}
