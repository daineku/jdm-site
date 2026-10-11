import ArticleBody from './ArticleBody'
import { formatArticleDate, type Article } from '@/lib/journalShared'

/** The article itself. Also rendered by the admin preview (see JournalTab) so both match. */
type Props = {
  article: Pick<Article, 'title' | 'excerpt' | 'body' | 'category' | 'cover_image_url' | 'cover_alt' | 'published_at'>
  /** Admin preview: no space reserved for the fixed site header. */
  preview?: boolean
}

export default function ArticleView({ article, preview = false }: Props) {
  return (
    <article className={`st-article${preview ? ' st-article--preview' : ''}`} aria-labelledby="article-title">
      <div className="st-container">
        <header className="st-article__head">
          <p className="st-journal__meta" style={{ margin: 0, justifyContent: 'center' }}>
            {article.category && <span className="st-label">{article.category}</span>}
            {article.published_at && <time dateTime={article.published_at}>{formatArticleDate(article.published_at)}</time>}
          </p>
          <h1 id="article-title" className="st-h2">{article.title}</h1>
          {article.excerpt && <p className="st-lead">{article.excerpt}</p>}
        </header>
        {article.cover_image_url && (
          <div className="st-crop st-article__cover">
            {/* eslint-disable-next-line @next/next/no-img-element -- covers live on the R2 media origin, which may be a custom host */}
            <img src={article.cover_image_url} alt={article.cover_alt} fetchPriority="high"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <ArticleBody source={article.body} />
      </div>
    </article>
  )
}
