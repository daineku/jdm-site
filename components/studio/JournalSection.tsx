import Link from 'next/link'
import type { ArticleCard } from '@/lib/journal'
import { JOURNAL } from './content'
import JournalCards from './JournalCards'
import { Arrow, SectionHeading } from './primitives'

/** Homepage Journal. Renders nothing until at least one article is published. */
export default function JournalSection({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null
  return (
    <section id="journal" className="st-section" aria-labelledby="journal-title">
      <div className="st-container">
        <SectionHeading id="journal-title" label={JOURNAL.label} title={JOURNAL.title} lead={JOURNAL.lead} className="st-section-head" />
        <JournalCards articles={articles} />
        <div className="st-journal__more">
          <Link href="/journal" className="st-btn st-btn--ghost">{JOURNAL.cta} <Arrow /></Link>
        </div>
      </div>
    </section>
  )
}
