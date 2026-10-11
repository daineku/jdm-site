import Link from 'next/link'
import { formatArticleDate, type ArticleCard } from '@/lib/journalShared'
import { delay } from './primitives'

/** Article cards — homepage Journal section and the /journal index. */
export default function JournalCards({ articles, headingLevel = 3 }: { articles: ArticleCard[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <ul className="st-journal__grid">
      {articles.map((a, i) => (
        <li key={a.id} className="st-journal__card st-hover" data-reveal="" style={delay((i % 3) * 100)}>
          <div className={`st-crop st-journal__media${a.cover_image_url ? '' : ' st-journal__media--empty'}`}>
            {a.cover_image_url && (
              <div className="st-crop__zoom">
                {/* eslint-disable-next-line @next/next/no-img-element -- covers live on the R2 media origin, which may be a custom host */}
                <img src={a.cover_image_url} alt={a.cover_alt} loading="lazy" decoding="async"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div className="st-journal__copy">
            <p className="st-journal__meta" style={{ margin: 0 }}>
              {a.category && <span className="st-label">{a.category}</span>}
              {a.published_at && <time dateTime={a.published_at}>{formatArticleDate(a.published_at)}</time>}
            </p>
            <Heading className="st-h3 st-journal__title">
              <Link href={`/journal/${a.slug}`}>{a.title}</Link>
            </Heading>
            {a.excerpt && <p className="st-body">{a.excerpt}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
