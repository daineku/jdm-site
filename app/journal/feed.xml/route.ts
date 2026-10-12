import { getPublishedArticles } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'

// RSS 2.0 feed of the Journal. Built per request from the same published-only read as the
// pages, so publishing or unpublishing in the admin is reflected on the next fetch.
export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  const base = getBaseUrl()
  const articles = (await getPublishedArticles()).slice(0, 50)
  const latest = articles[0]?.published_at ? new Date(articles[0].published_at) : new Date()

  const items = articles.map(a => {
    const url = `${base}/journal/${a.slug}`
    return [
      '    <item>',
      `      <title>${esc(a.title)}</title>`,
      `      <link>${esc(url)}</link>`,
      `      <guid isPermaLink="true">${esc(url)}</guid>`,
      a.published_at ? `      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : '',
      a.category ? `      <category>${esc(a.category)}</category>` : '',
      a.excerpt ? `      <description>${esc(a.excerpt)}</description>` : '',
      '    </item>',
    ].filter(Boolean).join('\n')
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>DAINEKU Journal</title>',
    `    <link>${esc(base)}/journal</link>`,
    `    <atom:link href="${esc(base)}/journal/feed.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Development notes, technical experiments and the decisions behind DAINEKU’s real-time simulation, environment and cinematic work.</description>',
    '    <language>en-GB</language>',
    `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  })
}
