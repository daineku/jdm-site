import type { Metadata } from 'next'
import JournalCards from '@/components/studio/JournalCards'
import { FeaturedStory } from '@/components/studio/Editorial'
import Reveal from '@/components/studio/Reveal'
import { JOURNAL } from '@/components/studio/content'
import { editorialOrder, getPublishedArticles } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'
import { JsonLd, articleNode, blogId, breadcrumbNode, orgId, organizationNode } from '@/lib/jsonld'

// Statically generated; purged the moment the admin publishes, edits or unpublishes (the
// journal reads are tagged, lib/journal.ts) and refreshed every five minutes otherwise.
export const revalidate = 300

const TITLE = 'Articles | DAINEKU'
const DESCRIPTION = 'Development notes, technical experiments and the decisions behind DAINEKU’s real-time simulation, environment and cinematic work.'

export async function generateMetadata(): Promise<Metadata> {
  // Until the first article is published the index is an empty landing page: crawlable (so the
  // link from the navigation resolves) but not indexable, and absent from the sitemap.
  const empty = (await getPublishedArticles()).length === 0
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: '/journal', types: { 'application/rss+xml': '/journal/feed.xml' } },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: 'website', url: '/journal', siteName: 'DAINEKU', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/brand/og.jpg'] },
  }
}

export default async function JournalIndex() {
  const articles = editorialOrder(await getPublishedArticles())
  const [lead, ...rest] = articles
  const base = getBaseUrl()
  const graph = lead && [
    organizationNode(base),
    breadcrumbNode(base, [{ name: 'DAINEKU', path: '/' }, { name: 'Articles', path: '/journal' }]),
    {
      '@type': 'Blog',
      '@id': blogId(base),
      name: 'DAINEKU Articles',
      url: `${base}/journal`,
      description: DESCRIPTION,
      inLanguage: 'en-GB',
      publisher: { '@id': orgId(base) },
      blogPost: articles.map(a => articleNode(base, a)),
    },
  ]

  return (
    <main className="studio st-main">
      {graph && <JsonLd nodes={graph} />}
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
