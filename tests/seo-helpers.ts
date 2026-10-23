import type { APIRequestContext } from '@playwright/test'

/**
 * Shared by tests/seo.spec.ts and tests/seo-articles.spec.ts: read a page the way a crawler
 * does (one HTTP request, Googlebot user agent, raw HTML) and pick metadata out of it.
 * The smoke server has no NEXT_PUBLIC_SITE_URL, so canonical URLs, Open Graph URLs and sitemap
 * entries use the production base (lib/seo.ts) while the pages are served on localhost.
 */

export const BASE = 'https://daineku.com'
export const pathOf = (abs: string) => new URL(abs).pathname + new URL(abs).search

const attr = (html: string, re: RegExp) => html.match(re)?.[1] ?? null
export const decode = (s: string | null) => s?.replace(/&amp;/g, '&').replace(/&#x27;/g, '’').replace(/&quot;/g, '"') ?? null

export const head = {
  title: (html: string) => decode(attr(html, /<title>([^<]*)<\/title>/)),
  description: (html: string) => decode(attr(html, /<meta name="description" content="([^"]*)"/)),
  canonical: (html: string) => attr(html, /<link rel="canonical" href="([^"]*)"/),
  canonicalCount: (html: string) => (html.match(/<link rel="canonical"/g) ?? []).length,
  robots: (html: string) => (html.match(/<meta name="robots" content="([^"]*)"/g) ?? []).map(m => m.match(/content="([^"]*)"/)![1]),
  og: (html: string, p: string) => decode(attr(html, new RegExp(`<meta property="og:${p}" content="([^"]*)"`))),
  twitter: (html: string, p: string) => decode(attr(html, new RegExp(`<meta name="twitter:${p}" content="([^"]*)"`))),
  h1s: (html: string) => (html.match(/<h1\b/g) ?? []).length,
  jsonLd: (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])),
}

let ipSeq = 0
/** The admin API rate-limits per client IP (60/min); each caller identifies as its own address. */
export const clientIp = () => `203.0.113.${(process.pid + ipSeq++ * 7 + Math.floor(Math.random() * 50)) % 250 + 1}`
export const adminHeaders = () => ({ 'x-admin-secret': process.env.SMOKE_ADMIN_PATH!, 'x-forwarded-for': clientIp() })

export async function html(request: APIRequestContext, path: string) {
  const res = await request.get(path, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } })
  return { res, html: await res.text() }
}

/** Every value in a JSON-LD document that is reachable under `key`. */
export function collect(node: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(node)) node.forEach(n => collect(n, key, out))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) { if (k === key) out.push(v); collect(v, key, out) }
  }
  return out
}

/** The nodes of every document: its `@graph` members, or the document itself. */
export const nodesOf = (docs: unknown[]) => docs.flatMap(d => (d as { '@graph'?: unknown[] })['@graph'] ?? [d]) as Record<string, unknown>[]

/** A sitemap's entries. Next.js writes each element on its own line, so whitespace is tolerated. */
export function sitemapEntries(xml: string) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
    loc: m[1].match(/<loc>([^<]*)<\/loc>/)![1],
    lastmod: m[1].match(/<lastmod>([^<]*)<\/lastmod>/)?.[1] ?? null,
  }))
}
