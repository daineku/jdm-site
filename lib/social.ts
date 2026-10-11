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
 * Public contact address for the studio. Comes from NEXT_PUBLIC_CONTACT_EMAIL only —
 * no address is ever invented. Returns null when unset or not a plausible address.
 */
export function getContactEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}
