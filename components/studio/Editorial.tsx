import Link from 'next/link'
import { formatArticleDate, type ArticleCard } from '@/lib/journalShared'
import { JOURNAL } from './content'
import { Arrow, delay } from './primitives'

/**
 * Editorial blocks shared by the homepage Journal section and the /journal index:
 * one featured story (large cover, title, date, introduction) and a compact list of
 * further articles. Covers live on the R2 media origin (any host), so they are plain
 * <img> elements inside fixed-ratio frames — no layout shift, lazy below the fold.
 */

function Meta({ a, className = '' }: { a: ArticleCard; className?: string }) {
  return (
    <p className={`st-journal__meta ${className}`} style={{ margin: 0 }}>
      {a.category && <span className="st-label">{a.category}</span>}
      {a.published_at && <time dateTime={a.published_at}>{formatArticleDate(a.published_at)}</time>}
    </p>
  )
}

export function FeaturedStory({ article: a, headingLevel = 3, eager = false }: { article: ArticleCard; headingLevel?: 2 | 3; eager?: boolean }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="st-story st-hover" data-reveal="">
      <div className={`st-crop st-story__media${a.cover_image_url ? '' : ' st-journal__media--empty'}`}>
        {a.cover_image_url && (
          <div className="st-crop__zoom">
            {/* eslint-disable-next-line @next/next/no-img-element -- covers live on the R2 media origin, which may be a custom host */}
            <img src={a.cover_image_url} alt={a.cover_alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
              {...(eager ? { fetchPriority: 'high' as const } : {})}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <span className="st-frame-tag st-frame-tag--tl">{JOURNAL.featuredLabel}</span>
      </div>
      <div className="st-story__copy">
        <Meta a={a} />
        <Heading className="st-story__title st-journal__title">
          <Link href={`/journal/${a.slug}`}>{a.title}</Link>
        </Heading>
        {a.excerpt && <p className="st-lead st-story__excerpt">{a.excerpt}</p>}
        <span className="st-story__cta" aria-hidden="true">{JOURNAL.readCta} <Arrow /></span>
      </div>
    </article>
  )
}

export function LatestList({ articles, headingLevel = 4 }: { articles: ArticleCard[]; headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h4'
  return (
    <ul className="st-story-list">
      {articles.map((a, i) => (
        <li key={a.id} className="st-story-row st-hover" data-reveal="" style={delay(i * 80)}>
          <div className={`st-crop st-story-row__media${a.cover_image_url ? '' : ' st-journal__media--empty'}`}>
            {a.cover_image_url && (
              <div className="st-crop__zoom">
                {/* eslint-disable-next-line @next/next/no-img-element -- covers live on the R2 media origin, which may be a custom host */}
                <img src={a.cover_image_url} alt={a.cover_alt} loading="lazy" decoding="async"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div className="st-story-row__copy">
            <Meta a={a} />
            <Heading className="st-h3 st-journal__title st-story-row__title">
              <Link href={`/journal/${a.slug}`}>{a.title}</Link>
            </Heading>
            {a.excerpt && <p className="st-body st-story-row__excerpt">{a.excerpt}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
