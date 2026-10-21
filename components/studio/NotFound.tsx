import type { Metadata } from 'next'
import Link from 'next/link'
import { Arrow } from './primitives'

/** Metadata for every not-found page. Next.js itself adds `<meta name="robots" content="noindex">` to a 404. */
export const notFoundMetadata: Metadata = {
  title: 'Page not found',
  description: 'The page you asked for does not exist on the DAINEKU website.',
}

/**
 * The 404 content. Served with a real 404 status (no loading boundary sits above the public
 * pages, so notFound() resolves before the response is flushed). Rendered inside the studio
 * frame from app/(studio)/not-found.tsx, app/[adminPath]/not-found.tsx and app/not-found.tsx.
 */
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
