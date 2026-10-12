import type { Metadata } from 'next'
import JournalCards from '@/components/studio/JournalCards'
import { FeaturedStory } from '@/components/studio/Editorial'
import Reveal from '@/components/studio/Reveal'
import { JOURNAL } from '@/components/studio/content'
import { editorialOrder, getPublishedArticles } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'

// Read per request so an article published in the admin appears immediately — no rebuild.
export const dynamic = 'force-dynamic'

const TITLE = 'Articles | DAINEKU'
const DESCRIPTION = 'Development notes, technical experiments and the decisions behind DAINEKU’s real-time simulation, environment and cinematic work.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/journal', types: { 'application/rss+xml': '/journal/feed.xml' } },
  openGraph: { type: 'website', url: '/journal', siteName: 'DAINEKU', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
}

export default async function JournalIndex() {
  const articles = editorialOrder(await getPublishedArticles())
  const [lead, ...rest] = articles
  const base = getBaseUrl()
  const jsonLd = lead && {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'DAINEKU Journal',
    url: `${base}/journal`,
    description: DESCRIPTION,
    publisher: { '@type': 'Organization', name: 'DAINEKU', url: `${base}/` },
    blogPost: articles.map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${base}/journal/${a.slug}`,
      ...(a.published_at ? { datePublished: a.published_at } : {}),
      ...(a.cover_image_url ? { image: a.cover_image_url } : {}),
    })),
  }

  return (
    <main className="studio st-main">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      )}
      <section className="st-section st-article st-editorial" aria-labelledby="journal-title">
        <div className="st-container">
          <div className="st-heading st-heading--center st-section-head">
            <p className="st-label st-label--rule" style={{ margin: 0 }}>{JOURNAL.label}</p>
            <h1 id="journal-title" className="st-h2 st-heading__title">{JOURNAL.title}</h1>
            <p className="st-lead">{JOURNAL.lead}</p>
          </div>
          {lead ? (
            <>
              <FeaturedStory article={lead} headingLevel={2} eager />
              {rest.length > 0 && (
                <div className="st-editorial__latest">
                  <h2 className="st-label st-label--rule st-editorial__latest-title">All articles</h2>
                  <JournalCards articles={rest} headingLevel={3} />
                </div>
              )}
              <p className="st-editorial__feed st-body">
                <a href="/journal/feed.xml" type="application/rss+xml">RSS feed</a>
              </p>
            </>
          ) : (
            <p className="st-body st-journal__empty">No articles have been published yet.</p>
          )}
        </div>
      </section>
      <Reveal />
    </main>
  )
}
