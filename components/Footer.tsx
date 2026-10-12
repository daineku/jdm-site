import Link from 'next/link'
import { SectionDivider } from '@/components/studio/primitives'

/**
 * Studio footer: the brand divider artwork, the two legal pages and a copyright line.
 * Nothing else on purpose — the header already carries the wordmark and navigation, and the
 * legacy archive routes stay reachable directly but are no longer advertised here.
 */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="studio st-footer">
      <div className="st-container">
        <SectionDivider />
        <div className="st-footer__bottom">
          <span>© {year} DAINEKU</span>
          <nav aria-label="Legal">
            <ul className="st-footer__legal">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
