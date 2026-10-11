import type { Metadata } from 'next'
import JournalCards from '@/components/studio/JournalCards'
import Reveal from '@/components/studio/Reveal'
import { JOURNAL } from '@/components/studio/content'
import { getPublishedArticles } from '@/lib/journal'

// Read per request so an article published in the admin appears immediately — no rebuild.
export const dynamic = 'force-dynamic'

const TITLE = 'Journal — DAINEKU'
const DESCRIPTION = 'Development notes, technical experiments and the decisions behind DAINEKU’s real-time simulation, environment and cinematic work.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/journal' },
  openGraph: { type: 'website', url: '/journal', siteName: 'DAINEKU', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
}

export default async function JournalIndex() {
  const articles = await getPublishedArticles()
  return (
    <main className="studio st-main">
      <section className="st-section st-article" aria-labelledby="journal-title">
        <div className="st-container">
          <div className="st-heading st-heading--center st-section-head">
            <p className="st-label st-label--rule" style={{ margin: 0 }}>{JOURNAL.label}</p>
            <h1 id="journal-title" className="st-h2 st-heading__title">{JOURNAL.title}</h1>
            <p className="st-lead">{JOURNAL.lead}</p>
          </div>
          {articles.length > 0
            ? <JournalCards articles={articles} headingLevel={2} />
            : <p className="st-body st-journal__empty">No articles have been published yet.</p>}
        </div>
      </section>
      <Reveal />
    </main>
  )
}
