import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleView from '@/components/studio/ArticleView'
import { Arrow } from '@/components/studio/primitives'
import { getPublishedArticle } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'

// Read per request: edits and unpublishing in the admin take effect immediately.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublishedArticle((await params).slug)
  if (!article) return { title: { absolute: 'Article not found | DAINEKU' }, robots: { index: false } }
  const title = `${article.title} | DAINEKU`
  const description = article.excerpt || undefined
  const images = article.cover_image_url ? [{ url: article.cover_image_url, alt: article.cover_alt }] : ['/images/brand/og.jpg']
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: {
      type: 'article',
      url: `/journal/${article.slug}`,
      siteName: 'DAINEKU',
      title,
      description,
      images,
      ...(article.published_at ? { publishedTime: article.published_at } : {}),
      modifiedTime: article.updated_at,
    },
    twitter: { card: 'summary_large_image', title, description, images: article.cover_image_url ? [article.cover_image_url] : ['/images/brand/og.jpg'] },
  }
}

export default async function ArticlePage({ params }: Props) {
  const article = await getPublishedArticle((await params).slug)
  if (!article) notFound()

  const base = getBaseUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    mainEntityOfPage: `${base}/journal/${article.slug}`,
    ...(article.cover_image_url ? { image: [article.cover_image_url] } : {}),
    author: { '@type': 'Organization', name: 'DAINEKU', url: `${base}/` },
    publisher: { '@type': 'Organization', name: 'DAINEKU', logo: { '@type': 'ImageObject', url: `${base}/images/brand/logo.png` } },
  }

  return (
    <main className="studio st-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ArticleView article={article} />
      <div className="st-container">
        <p className="st-article__back">
          <Link href="/journal" className="st-btn st-btn--ghost"><span aria-hidden="true">←</span> All articles</Link>
        </p>
      </div>
      <div className="st-container" style={{ paddingBottom: 'var(--st-section-y)' }}>
        <p className="st-article__back st-body">
          Working on something similar? <Link href="/#contact" style={{ color: 'var(--st-gold)' }}>Discuss a project <Arrow /></Link>
        </p>
      </div>
    </main>
  )
}
