import Link from 'next/link'
import type { ReactNode } from 'react'

export type LegalSection = { id: string; title: string; body: ReactNode }

/**
 * Shared layout for /privacy and /terms: one h1, dated, a short table of contents and the
 * sections as h2s in the studio's article typography.
 *
 * OWNER NOTE: both documents are production drafts written from what the site actually does
 * (October 2026). They name no legal entity, address or governing law because none has been
 * provided. Have them reviewed before relying on them, and update them whenever the site starts
 * processing data differently (analytics, a new provider, stored enquiries…).
 */
export default function LegalPage({ title, intro, updated, sections, other }: {
  title: string
  intro: ReactNode
  /** ISO date, e.g. 2026-10-13 */
  updated: string
  sections: LegalSection[]
  other: { href: string; label: string }
}) {
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(updated))
  return (
    <main className="studio st-main">
      <article className="st-section st-article st-legal" aria-labelledby="legal-title">
        <div className="st-container">
          <header className="st-article__head">
            <p className="st-label st-label--rule" style={{ margin: 0 }}>Legal</p>
            <h1 id="legal-title" className="st-h2">{title}</h1>
            <p className="st-journal__meta" style={{ margin: 0, justifyContent: 'center' }}>
              <span>Last updated</span> <time dateTime={updated}>{date}</time>
            </p>
          </header>

          <div className="st-prose">
            <p className="st-legal__intro">{intro}</p>
            <nav aria-label="On this page" className="st-legal__toc">
              <ol>
                {sections.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
              </ol>
            </nav>
            {sections.map(s => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
                <h2 id={`${s.id}-title`}>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>

          <p className="st-article__back st-legal__links">
            <Link href={other.href} className="st-btn st-btn--ghost">{other.label}</Link>
            <Link href="/" className="st-btn st-btn--ghost"><span aria-hidden="true">←</span> Home</Link>
          </p>
        </div>
      </article>
    </main>
  )
}
