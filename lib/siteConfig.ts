import type { SiteSettings } from '@/lib/types'

export type FooterLink = {
  label: string
  href: string
  rel?: string
}

export type FooterConfig = {
  copyrightName: string       // displayed in "© year" line — falls back to siteTitle
  links: FooterLink[]         // populated later: Terms, Privacy, Affiliate Disclosure, etc.
  disclaimer: string          // optional small disclaimer text below the line
  showLinks: boolean          // set true when links array is ready to render
  showDisclaimer: boolean     // set true when disclaimer copy is ready to render
}

export type SiteConfig = {
  siteTitle: string
  footer: FooterConfig
}

/**
 * Build a SiteConfig from live SiteSettings.
 * Adding links or disclaimer copy later is a config change only —
 * the Footer component does not need to be rewritten.
 */
export function buildSiteConfig(settings: SiteSettings | null): SiteConfig {
  const siteTitle = settings?.site_title || 'DAINEKU'

  return {
    siteTitle,
    footer: {
      copyrightName: siteTitle,   // override here if brand name differs from site_title
      links: [],                  // e.g. { label: 'Privacy Policy', href: '/privacy' }
      disclaimer: '',             // e.g. 'This site contains affiliate links.'
      showLinks: false,
      showDisclaimer: false,
    },
  }
}
