import Image from 'next/image'
import Link from 'next/link'
import wordmark from '@/public/images/brand/title-wordmark.png'
import type { SiteConfig } from '@/lib/siteConfig'
import type { SocialLink } from '@/lib/social'
import { STUDIO_NAV } from '@/components/studio/content'
import { SocialList } from '@/components/studio/SocialIcons'
import { SectionDivider } from '@/components/studio/primitives'

/**
 * Studio footer. Brand wordmark, studio navigation, configured socials only,
 * and a quiet secondary link into the legacy JDM archive.
 * Optional legal links / disclaimer still come from SiteConfig.footer.
 * The year is computed at render time.
 */
export default function Footer({ config, socials }: { config: SiteConfig; socials: SocialLink[] }) {
  const { footer } = config
  const year = new Date().getFullYear()

  return (
    <footer className="studio st-footer">
      <div className="st-container">
        <div className="st-footer__top">
          <div className="st-footer__brand">
            <Link href="/" aria-label="DAINEKU — home">
              <Image
                src={wordmark}
                alt="DAINEKU — Real-Time Simulation & Spatial Design"
                className="st-footer__wordmark"
                sizes="(max-width: 999px) 260px, 360px"
              />
            </Link>
            <p className="st-body">
              Independent creative technology studio for real-time simulation, digital environments and spatial experiences.
            </p>
          </div>

          <nav className="st-footer__col" aria-label="Footer">
            <p className="st-label st-label--muted" style={{ margin: 0 }}>Studio</p>
            <ul>
              {[...STUDIO_NAV, { id: 'contact', label: 'Contact' } as const].map(item => (
                <li key={item.id}><a className="st-footer__link" href={`/#${item.id}`}>{item.label}</a></li>
              ))}
            </ul>
          </nav>

          <div className="st-footer__col">
            <p className="st-label st-label--muted" style={{ margin: 0 }}>Editorial</p>
            <ul>
              <li><Link className="st-footer__link" href="/archive">JDM Archive</Link></li>
              <li><Link className="st-footer__link" href="/builds">Builds</Link></li>
              <li><Link className="st-footer__link" href="/parts">Parts</Link></li>
            </ul>
          </div>

          {socials.length > 0 && (
            <div className="st-footer__col">
              <p className="st-label st-label--muted" style={{ margin: 0 }}>Follow</p>
              <SocialList links={socials} />
            </div>
          )}
        </div>

        <SectionDivider />

        {footer.showLinks && footer.links.length > 0 && (
          <nav aria-label="Legal" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 20 }}>
            {footer.links.map(link => (
              <a key={link.href} className="st-footer__link" href={link.href} rel={link.rel}>{link.label}</a>
            ))}
          </nav>
        )}
        {footer.showDisclaimer && footer.disclaimer && (
          <p className="st-body" style={{ fontSize: 13, paddingTop: 14 }}>{footer.disclaimer}</p>
        )}

        <div className="st-footer__bottom">
          <span>© {year} DAINEKU. All rights reserved.</span>
          <a href="#main">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}
