import type { Metadata } from 'next'
import Link from 'next/link'
import { Arrow } from '@/components/studio/primitives'

/**
 * Site-wide 404. The App Router serves it with a real 404 status (there is no loading boundary
 * above the public pages, so notFound() resolves before the response is flushed), and it is
 * noindexed so a mistyped URL can never become an indexed page.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you asked for does not exist on the DAINEKU website.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="studio st-main">
      <section className="st-section st-article st-legal" aria-labelledby="nf-title">
        <div className="st-container">
          <header className="st-article__head">
            <p className="st-label st-label--rule" style={{ margin: 0 }}>Error 404</p>
            <h1 id="nf-title" className="st-h2">Page not found</h1>
            <p className="st-lead">The page you asked for does not exist or has moved.</p>
          </header>
          <p className="st-article__back st-legal__links" style={{ justifyContent: 'center' }}>
            <Link href="/" className="st-btn st-btn--gold">Studio home <Arrow /></Link>
            <Link href="/journal" className="st-btn st-btn--ghost">Articles <Arrow /></Link>
          </p>
        </div>
      </section>
    </main>
  )
}
