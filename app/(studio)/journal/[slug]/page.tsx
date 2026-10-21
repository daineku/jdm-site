import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleView from '@/components/studio/ArticleView'
import { Arrow } from '@/components/studio/primitives'
import { getPublishedArticle } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'
import { JsonLd, articleNode, breadcrumbNode, organizationNode } from '@/lib/jsonld'

// Rendered on first request and then served statically; purged the moment the admin edits or
// unpublishes (the journal reads are tagged, lib/journal.ts) and refreshed every five minutes.
export const revalidate = 300

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
      authors: ['DAINEKU'],
      ...(article.category ? { section: article.category } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: article.cover_image_url ? [article.cover_image_url] : ['/images/brand/og.jpg'] },
  }
}

export default async function ArticlePage({ params }: Props) {
  const article = await getPublishedArticle((await params).slug)
  if (!article) notFound()

  const base = getBaseUrl()
  const graph = [
    organizationNode(base),
    breadcrumbNode(base, [{ name: 'DAINEKU', path: '/' }, { name: 'Articles', path: '/journal' }, { name: article.title, path: `/journal/${article.slug}` }]),
    articleNode(base, article),
  ]

  return (
    <main className="studio st-main">
      <JsonLd nodes={graph} />
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
