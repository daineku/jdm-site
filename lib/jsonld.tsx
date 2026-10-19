import type { Project } from './projects'
import type { Article } from './journalShared'
import { STUDIO_DESCRIPTION } from './seo'

/**
 * schema.org JSON-LD for the studio pages. One Organization node (`#organization`) is declared
 * per page and every other node references it by `@id`, so no page carries two conflicting
 * Organization declarations. Everything here must match visible page content: no ratings,
 * reviews, addresses, prices or social accounts that are not configured.
 */

type Node = Record<string, unknown>

export const orgId = (base: string) => `${base}/#organization`
export const websiteId = (base: string) => `${base}/#website`

export function organizationNode(base: string, sameAs: string[] = []): Node {
  return {
    '@type': 'Organization',
    '@id': orgId(base),
    name: 'DAINEKU',
    url: `${base}/`,
    logo: { '@type': 'ImageObject', url: `${base}/images/brand/logo.png` },
    description: STUDIO_DESCRIPTION,
    knowsAbout: [
      'Real-time simulation',
      'Vehicle dynamics',
      'AI traffic simulation',
      'Interactive 3D environments',
      'Real-time lighting and rendering',
      'Cinematic video production',
    ],
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function webSiteNode(base: string): Node {
  return {
    '@type': 'WebSite',
    '@id': websiteId(base),
    url: `${base}/`,
    name: 'DAINEKU',
    description: STUDIO_DESCRIPTION,
    inLanguage: 'en-GB',
    publisher: { '@id': orgId(base) },
  }
}

/**
 * A studio project. The Kanjo is a racing simulation in development, so it is a VideoGame
 * (a CreativeWork and SoftwareApplication) created by the studio — not client work.
 */
export function projectNode(base: string, project: Project): Node {
  return {
    '@type': 'VideoGame',
    '@id': `${base}/#project-${project.slug}`,
    name: project.title,
    alternativeHeadline: project.tagline,
    description: project.summary.join(' '),
    genre: project.disciplines.includes('Racing simulation') ? 'Racing simulation' : project.disciplines[0],
    applicationCategory: 'Game',
    creativeWorkStatus: project.statusLabel,
    image: `${base}${project.cover.desktop.src}`,
    ...(project.link ? { url: project.link.href } : {}),
    mainEntityOfPage: `${base}/#work`,
    creator: { '@id': orgId(base) },
    author: { '@id': orgId(base) },
  }
}

export function breadcrumbNode(base: string, items: { name: string; path: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  }
}

export const blogId = (base: string) => `${base}/journal#blog`

export function articleNode(base: string, article: Pick<Article, 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'published_at' | 'updated_at' | 'category'>): Node {
  return {
    '@type': 'BlogPosting',
    '@id': `${base}/journal/${article.slug}#article`,
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    url: `${base}/journal/${article.slug}`,
    mainEntityOfPage: `${base}/journal/${article.slug}`,
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    dateModified: article.updated_at,
    ...(article.cover_image_url ? { image: [article.cover_image_url] } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    inLanguage: 'en-GB',
    isPartOf: { '@id': blogId(base) },
    author: { '@id': orgId(base) },
    publisher: { '@id': orgId(base) },
  }
}

/** One `<script type="application/ld+json">` holding a `@graph` of nodes. */
export function JsonLd({ nodes }: { nodes: Node[] }) {
  const data = { '@context': 'https://schema.org', '@graph': nodes }
  return (
    <script
      type="application/ld+json"
      // `<` is escaped so a value can never close the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }}
    />
  )
}
