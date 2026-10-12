import Link from 'next/link'
import type { ArticleCard } from '@/lib/journal'
import { JOURNAL } from './content'
import { FeaturedStory, LatestList } from './Editorial'
import { Arrow } from './primitives'

/**
 * Homepage Journal: one featured story and up to three latest updates — never a feed.
 * Renders nothing until at least one article is published (no empty placeholders).
 */
export default function JournalSection({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null
  const [lead, ...rest] = articles
  const latest = rest.slice(0, 3)
  return (
    <section id="journal" className="st-section st-editorial" aria-labelledby="journal-title">
      <div className="st-container">
        <header className="st-editorial__head" data-reveal="">
          <div>
            <p className="st-label st-label--rule" style={{ margin: 0 }}>{JOURNAL.label}</p>
            <h2 id="journal-title" className="st-h2">{JOURNAL.title}</h2>
          </div>
          <p className="st-lead st-editorial__lead">{JOURNAL.lead}</p>
        </header>

        <FeaturedStory article={lead} />

        {latest.length > 0 && (
          <div className="st-editorial__latest">
            <h3 className="st-label st-label--rule st-editorial__latest-title">{JOURNAL.latestLabel}</h3>
            <LatestList articles={latest} />
          </div>
        )}

        <div className="st-journal__more">
          <Link href="/journal" className="st-btn st-btn--ghost">{JOURNAL.cta} <Arrow /></Link>
        </div>
      </div>
    </section>
  )
}
