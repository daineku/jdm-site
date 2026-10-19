import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { BASE, adminHeaders, head, html, nodesOf, sitemapEntries } from './seo-helpers'

/**
 * The editorial lifecycle as a crawler sees it: draft → published → deleted. Creates and removes
 * its own article through the admin API. It runs in its own Playwright project after the
 * parallel suites (playwright.config.ts), because the journal smoke tests assume exclusive
 * control of the CMS state while they run.
 */

test.describe.configure({ mode: 'serial' })

const stamp = Date.now()
const slug = `seo-crawl-check-${stamp}`
const title = `Rendering a Wet Expressway ${stamp}`
const excerpt = 'How reflections, lamp bloom and road paint were balanced so the night scene reads at speed.'
const coverKey = `journal/seo-cover-${stamp}.jpg`
const coverUrl = `${process.env.MOCK_BACKEND_URL}/media/${coverKey}`
const coverAlt = 'An elevated expressway at night, lamps reflected in wet asphalt'
let id = ''
const headers = adminHeaders()

test('a draft is a 404 and appears in neither the sitemap, the index nor the feed', async ({ request }) => {
  // A real JPEG in the (mock) media bucket, so the cover is fetchable like an uploaded one.
  const put = await request.put(`${process.env.MOCK_BACKEND_URL}/s3/smoke-bucket/${coverKey}`, {
    headers: { 'content-type': 'image/jpeg' }, data: readFileSync('public/images/projects/thekanjo-hero-mobile.jpg'),
  })
  expect(put.status()).toBe(200)
  const created = await request.post('/api/admin/journal', { headers, data: {
    title, slug, excerpt, category: 'Rendering',
    body: ['## Why night is hard', '', 'Sodium lamps, wet asphalt and car paint compete for the same highlights.', '', '![Expressway at night](https://media.example.invalid/night.jpg)'].join('\n'),
    cover_image_url: coverUrl, cover_alt: coverAlt,
  } })
  expect(created.status()).toBe(201)
  id = (await created.json()).article.id
  expect((await request.get(`/journal/${slug}`)).status()).toBe(404)
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(slug)
  expect(await (await request.get('/journal/feed.xml')).text()).not.toContain(slug)
  expect((await html(request, '/journal')).html).not.toContain(title)
  expect((await html(request, '/')).html).not.toContain(title)
})

test('once published: full server HTML, article metadata, BlogPosting + breadcrumbs, sitemap and feed', async ({ request, browser }) => {
  test.skip(!id, 'needs the draft created by the previous test')
  expect((await request.put('/api/admin/journal', { headers, data: { id, is_published: true } })).status()).toBe(200)
  const { res, html: h } = await html(request, `/journal/${slug}`)
  expect(res.status()).toBe(200)
  expect(head.title(h)).toBe(`${title} | DAINEKU`)
  expect(head.description(h)).toBe(excerpt)
  expect(head.canonicalCount(h)).toBe(1)
  expect(head.canonical(h)).toBe(`${BASE}/journal/${slug}`)
  expect(head.robots(h)).toEqual([])
  expect(head.og(h, 'type')).toBe('article')
  expect(head.og(h, 'url')).toBe(`${BASE}/journal/${slug}`)
  expect(head.og(h, 'image')).toBe(coverUrl)
  expect(h).toMatch(/<meta property="article:published_time" content="\d{4}-/)
  expect(h).toMatch(/<meta property="article:modified_time" content="\d{4}-/)
  expect(h).toContain('<meta property="article:author" content="DAINEKU"/>')
  expect(head.h1s(h)).toBe(1)
  // Body content, headings and images are in the HTML itself, with descriptive alt text.
  expect(h).toContain('Why night is hard')
  expect(h).toContain('Sodium lamps, wet asphalt and car paint')
  expect(h).toMatch(new RegExp(`<img[^>]*alt="${coverAlt}"`))
  expect(h).toMatch(/<img[^>]*src="https:\/\/media\.example\.invalid\/night\.jpg"[^>]*alt="Expressway at night"/)
  expect((await request.get(coverUrl)).headers()['content-type']).toBe('image/jpeg')

  const nodes = nodesOf(head.jsonLd(h))
  expect(nodes.filter(n => n['@type'] === 'Organization')).toHaveLength(1)
  const post = nodes.find(n => n['@type'] === 'BlogPosting')!
  expect(post).toMatchObject({
    headline: title, description: excerpt, url: `${BASE}/journal/${slug}`, mainEntityOfPage: `${BASE}/journal/${slug}`,
    author: { '@id': `${BASE}/#organization` }, publisher: { '@id': `${BASE}/#organization` }, articleSection: 'Rendering',
    image: [coverUrl],
  })
  expect(String(post.datePublished)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(String(post.dateModified)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  const crumbs = nodes.find(n => n['@type'] === 'BreadcrumbList')! as { itemListElement: { name: string; item: string }[] }
  expect(crumbs.itemListElement.map(c => c.name)).toEqual(['DAINEKU', 'Articles', title])
  expect(crumbs.itemListElement[2].item).toBe(`${BASE}/journal/${slug}`)

  // Sitemap: listed with its real modification time; the index is listed and indexable now.
  const entries = sitemapEntries(await (await request.get('/sitemap.xml')).text())
  const entry = entries.find(e => e.loc === `${BASE}/journal/${slug}`)
  expect(entry, 'article listed').toBeTruthy()
  expect(entry!.lastmod, 'with a real lastmod').toBeTruthy()
  expect(Math.abs(Date.parse(entry!.lastmod!) - Date.now())).toBeLessThan(5 * 60_000)
  expect(entries.map(e => e.loc)).toContain(`${BASE}/journal`)
  expect(head.robots((await html(request, '/journal')).html).join(' ')).not.toMatch(/noindex/)
  expect(await (await request.get('/journal/feed.xml')).text()).toContain(`${BASE}/journal/${slug}</link>`)
  // The homepage Journal section links to it.
  expect((await html(request, '/')).html).toContain(`href="/journal/${slug}"`)

  // The index and the article read fully without JavaScript.
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/journal')
  await expect(page.getByRole('link', { name: title })).toHaveAttribute('href', `/journal/${slug}`)
  await page.goto(`/journal/${slug}`)
  await expect(page.locator('h1')).toHaveText(title)
  await expect(page.locator('.st-prose h2')).toHaveText('Why night is hard')
  await expect(page.locator('.st-article__cover img')).toHaveAttribute('alt', coverAlt)
  await expect(page.getByRole('link', { name: /All articles/ })).toHaveAttribute('href', '/journal')
  await ctx.close()
})

test('an edit changes the article metadata and its sitemap timestamp on the next request', async ({ request }) => {
  test.skip(!id, 'needs the draft created by the previous test')
  const before = sitemapEntries(await (await request.get('/sitemap.xml')).text()).find(e => e.loc === `${BASE}/journal/${slug}`)!.lastmod!
  await new Promise(r => setTimeout(r, 1100))
  const edited = `${excerpt} Updated.`
  expect((await request.put('/api/admin/journal', { headers, data: { id, excerpt: edited } })).status()).toBe(200)
  const h = (await html(request, `/journal/${slug}`)).html
  expect(head.description(h)).toBe(edited)
  expect(head.og(h, 'description')).toBe(edited)
  const after = sitemapEntries(await (await request.get('/sitemap.xml')).text()).find(e => e.loc === `${BASE}/journal/${slug}`)!.lastmod!
  expect(Date.parse(after)).toBeGreaterThan(Date.parse(before))
})

test('deleting it removes the page, the sitemap entry and the feed item at once', async ({ request }) => {
  test.skip(!id, 'needs the draft created by the previous test')
  expect((await request.delete('/api/admin/journal', { headers, data: { id } })).status()).toBe(200)
  expect((await request.get(`/journal/${slug}`)).status()).toBe(404)
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(slug)
  expect(await (await request.get('/journal/feed.xml')).text()).not.toContain(slug)
  expect((await html(request, '/')).html).not.toContain(title)
  await request.delete(`${process.env.MOCK_BACKEND_URL}/s3/smoke-bucket/${coverKey}`)
})
