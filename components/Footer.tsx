import type { SiteConfig } from '@/lib/siteConfig'

type Props = {
  config: SiteConfig
}

/**
 * Footer component.
 *
 * Current output:
 *   DAINEKU · © 2026
 *
 * Future-proof: showLinks and showDisclaimer flags in config activate
 * additional sections without changes to this component structure.
 *
 * Current year is generated at render time — no manual updates needed.
 */
export default function Footer({ config }: Props) {
  const { siteTitle, footer } = config
  const displayName = footer.copyrightName || siteTitle
  const year = new Date().getFullYear()

  return (
    <footer style={{
      paddingTop: 56,
      paddingBottom: 48,
      textAlign: 'center',
    }}>
      {/* Primary line: © Year Site Title */}
      <p style={{
        margin: 0,
        fontSize: 11,
        letterSpacing: '0.08em',
        color: '#555',
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 500,
      }}>
        © {year} {siteTitle}
      </p>

      {/* Future: optional links row — rendered only when showLinks is true */}
      {footer.showLinks && footer.links.length > 0 && (
        <nav aria-label="Footer links" style={{ marginTop: 16 }}>
          {footer.links.map((link, i) => (
            <span key={link.href}>
              {i > 0 && <span style={{ margin: '0 10px', color: '#242424' }}>·</span>}
              <a
                href={link.href}
                rel={link.rel ?? 'noopener noreferrer'}
                style={{
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: '#333',
                  textDecoration: 'none',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {link.label}
              </a>
            </span>
          ))}
        </nav>
      )}

      {/* Future: optional disclaimer — rendered only when showDisclaimer is true */}
      {footer.showDisclaimer && footer.disclaimer && (
        <p style={{
          marginTop: 14,
          fontSize: 10,
          color: '#2a2a2a',
          letterSpacing: '0.04em',
          fontFamily: 'Manrope, sans-serif',
          maxWidth: 560,
          marginInline: 'auto',
          lineHeight: 1.6,
        }}>
          {footer.disclaimer}
        </p>
      )}
    </footer>
  )
}
