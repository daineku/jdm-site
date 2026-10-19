import { expect, test, type Page } from '@playwright/test'
import { BASE, collect, decode, head, html, nodesOf, pathOf, sitemapEntries } from './seo-helpers'

/**
 * Search-engine behaviour, asserted at the HTTP level and in a browser with JavaScript disabled:
 * what a crawler receives before any hydration. Runs against the same built server and mock
 * backend as smoke.spec.ts (see playwright.config.ts and tests/seo-helpers.ts). The editorial
 * lifecycle (draft → published → deleted) is in tests/seo-articles.spec.ts.
 */

test.describe('robots.txt', () => {
  test('production rules: API blocked, /_next/ and assets crawlable, sitemap advertised', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/text\/plain/)
    const body = await res.text()
    expect(body).toMatch(/User-Agent: \*/i)
    expect(body).toMatch(/^Allow: \/$/m)
    expect(body).toMatch(/^Disallow: \/api\/$/m)
    expect(body).toContain(`Sitemap: ${BASE}/sitemap.xml`)
    const disallowed = [...body.matchAll(/^Disallow: (.*)$/gm)].map(m => m[1].trim())
    for (const needed of ['/_next/static/x.js', '/_next/image?url=x', '/images/brand/og.jpg', '/journal', '/journal/feed.xml', '/privacy']) {
      expect(disallowed.some(d => d && needed.startsWith(d)), `${needed} must stay crawlable`).toBe(false)
    }
    // The secret admin path is never published through robots.txt.
    expect(body).not.toContain(process.env.SMOKE_ADMIN_PATH!)
  })
})

test.describe('sitemap.xml', () => {
  test('studio pages only, canonical URLs, real timestamps, every entry resolves to itself', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/xml/)
    const xml = await res.text()
    const urls = sitemapEntries(xml)
    const locs = urls.map(u => u.loc)
    expect(locs.length).toBeGreaterThanOrEqual(3)
    expect(new Set(locs).size).toBe(locs.length) // no duplicates
    for (const loc of locs) {
      expect(loc.startsWith(`${BASE}/`), loc).toBe(true)
      expect(loc, 'no query strings or fragments').not.toMatch(/[?#]/)
      expect(loc, 'legacy automotive routes are not advertised').not.toMatch(/\/(archive|cars|builds|parts)(\/|$)/)
      expect(loc).not.toContain('/api/')
      expect(loc).not.toContain(process.env.SMOKE_ADMIN_PATH!)
    }
    expect(locs).toContain(`${BASE}/`)
    expect(locs).toContain(`${BASE}/privacy`)
    expect(locs).toContain(`${BASE}/terms`)
    // The Articles index is listed only when at least one article is listed with it.
    expect(locs.includes(`${BASE}/journal`)).toBe(locs.some(l => l.startsWith(`${BASE}/journal/`)))

    const now = Date.now()
    for (const u of urls) {
      if (u.lastmod === null) continue
      expect(Number.isNaN(Date.parse(u.lastmod)), `${u.loc} lastmod ${u.lastmod}`).toBe(false)
      expect(Date.parse(u.lastmod)).toBeLessThanOrEqual(now + 60_000)
    }
    // Static pages never claim "modified now": the homepage has no date, the legal pages their real one.
    expect(urls.find(u => u.loc === `${BASE}/`)!.lastmod).toBeNull()
    expect(urls.find(u => u.loc === `${BASE}/privacy`)!.lastmod).toMatch(/^2026-10-13/)

    // Each listed page answers 200 and declares the listed URL as its canonical. Journal entries
    // belong to the journal tests running in parallel and are checked by the article test below.
    for (const loc of locs.filter(l => !l.startsWith(`${BASE}/journal`))) {
      const { res: r, html: h } = await html(request, pathOf(loc))
      expect(r.status(), loc).toBe(200)
      expect(head.canonicalCount(h), loc).toBe(1)
      expect(head.canonical(h)!.replace(/\/$/, ''), loc).toBe(loc.replace(/\/$/, ''))
      expect(head.robots(h).join(' '), loc).not.toMatch(/noindex/)
    }
  })
})

test.describe('metadata on the raw HTML', () => {
  const PAGES = ['/', '/privacy', '/terms']

  test('unique titles and descriptions, one canonical each, matching Open Graph and Twitter cards', async ({ request }) => {
    const seenTitles = new Set<string>(), seenDescriptions = new Set<string>()
    for (const path of [...PAGES, '/journal']) {
      const { res, html: h } = await html(request, path)
      expect(res.status(), path).toBe(200)
      const title = head.title(h)!, description = head.description(h)!
      expect(title.length, path).toBeGreaterThan(10)
      expect(title.length, path).toBeLessThanOrEqual(70)
      expect(description.length, path).toBeGreaterThan(50)
      expect(description.length, path).toBeLessThanOrEqual(160)
      expect(seenTitles.has(title), `duplicate title ${title}`).toBe(false)
      expect(seenDescriptions.has(description), `duplicate description on ${path}`).toBe(false)
      seenTitles.add(title); seenDescriptions.add(description)
      expect(head.canonicalCount(h), path).toBe(1)
      expect(head.canonical(h)!.replace(/\/$/, ''), path).toBe(`${BASE}${path}`.replace(/\/$/, ''))
      expect(head.og(h, 'title'), path).toBe(title)
      expect(head.og(h, 'description'), path).toBe(description)
      expect(head.og(h, 'url')!.replace(/\/$/, ''), path).toBe(`${BASE}${path}`.replace(/\/$/, ''))
      expect(head.og(h, 'type'), path).toBe('website')
      expect(head.og(h, 'site_name'), path).toBe('DAINEKU')
      expect(head.twitter(h, 'card'), path).toMatch(/^summary/)
      expect(head.twitter(h, 'title'), path).toBe(title)
      expect(head.h1s(h), path).toBe(1)
    }
    const home = (await html(request, '/')).html
    expect(head.title(home)).toBe('DAINEKU | Creative Technology & Simulation Studio')
    expect(head.og(home, 'image')).toBe(`${BASE}/images/brand/og.jpg`)
    expect(home).toContain(`<link rel="alternate" type="application/rss+xml" href="${BASE}/journal/feed.xml"/>`)
  })

  test('public pages are indexable and carry exactly one robots directive at most', async ({ request }) => {
    for (const path of PAGES) {
      const robots = head.robots((await html(request, path)).html)
      expect(robots.length, path).toBeLessThanOrEqual(1)
      expect(robots.join(' '), path).not.toMatch(/noindex/)
    }
  })

  test('the Articles index is indexable exactly when something is published', async ({ request }) => {
    const { html: h } = await html(request, '/journal')
    const empty = h.includes('No articles have been published yet.')
    const robots = head.robots(h).join(' ')
    if (empty) expect(robots).toMatch(/noindex/)
    else expect(robots).not.toMatch(/noindex/)
    expect(robots).not.toMatch(/nofollow/) // the links out of it are always followed
  })
})

test.describe('structured data', () => {
  test('homepage: one Organization, the WebSite and The Kanjo as the studio’s own project; nothing invented', async ({ request }) => {
    const docs = head.jsonLd((await html(request, '/')).html)
    expect(docs.length).toBeGreaterThanOrEqual(1)
    const nodes = nodesOf(docs)
    const orgs = nodes.filter(n => n['@type'] === 'Organization')
    expect(orgs).toHaveLength(1)
    expect(orgs[0]).toMatchObject({ '@id': `${BASE}/#organization`, name: 'DAINEKU', url: `${BASE}/` })
    expect(orgs[0].description).toBe('DAINEKU is a creative technology studio developing real-time simulations, interactive 3D experiences and cinematic digital environments.')
    const site = nodes.find(n => n['@type'] === 'WebSite')!
    expect(site).toMatchObject({ url: `${BASE}/`, publisher: { '@id': `${BASE}/#organization` } })
    const kanjo = nodes.find(n => n['@type'] === 'VideoGame')!
    expect(kanjo).toMatchObject({ name: 'The Kanjo', url: 'https://www.thekanjo.com/', creator: { '@id': `${BASE}/#organization` }, creativeWorkStatus: 'In development' })
    expect(String(kanjo.description)).toContain('driving simulation')
    expect(String(kanjo.image)).toMatch(new RegExp(`^${BASE}/_next/static/media/thekanjo-hero`))
    // Only real information: no ratings, reviews, prices, addresses or registrations.
    for (const key of ['aggregateRating', 'review', 'offers', 'address', 'telephone', 'priceRange', 'taxID', 'vatID']) {
      expect(collect(docs, key), key).toEqual([])
    }
    // Every @id reference resolves inside the document.
    const ids = new Set(nodes.map(n => n['@id']).filter(Boolean))
    for (const ref of collect(docs, '@id') as string[]) expect(ids.has(ref), ref).toBe(true)
  })

  test('every JSON-LD block on every public page is valid JSON with a schema.org context', async ({ request }) => {
    for (const path of ['/', '/journal', '/privacy', '/terms']) {
      const h = (await html(request, path)).html
      for (const raw of [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1])) {
        const doc = JSON.parse(raw)
        expect(doc['@context'], path).toBe('https://schema.org')
        expect(raw, 'a closing tag can never be smuggled in').not.toContain('</')
      }
    }
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the homepage delivers the studio’s content, headings and links in the initial HTML', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Real-time simulation, interactive 3D environments, cinematic visuals.')
    await expect(page.locator('.st-hero')).toContainText('Creative Technology & Simulation Studio')
    await expect(page.locator('.st-hero')).toContainText('DAINEKU develops driving simulations')
    const main = page.locator('main')
    for (const text of [
      'What We Build', 'Simulation & Interactive Systems', 'Vehicle dynamics and driving systems', 'AI traffic and autonomous behaviour',
      '3D Worlds & Spatial Design', 'Cinematic & Visual Production',
      'The Kanjo', 'Highway racing, simulated in real time.', 'elevated Japanese expressway', 'Pacejka-based tyre model', 'Inside the simulation',
      'Bring Your Next Project to Life.',
    ]) await expect(main, text).toContainText(text)
    // Reveal animations never hide content from a client that runs no script.
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1' || getComputedStyle(e).visibility === 'hidden').length)
    expect(hidden).toBe(0)
    expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(10)
    // Navigation and internal links are real anchors with real destinations (the primary nav is
    // display:none on phones, so these are attribute checks on the markup, not visibility checks).
    const nav = page.locator('nav[aria-label="Primary"]')
    await expect(nav.locator('a', { hasText: 'Capabilities' })).toHaveAttribute('href', '/#services')
    await expect(nav.locator('a', { hasText: 'Projects' })).toHaveAttribute('href', '/#work')
    await expect(nav.locator('a', { hasText: 'Articles' })).toHaveAttribute('href', '/journal')
    await expect(page.locator('a[href="https://www.thekanjo.com/"]')).toHaveCount(1)
    await expect(page.locator('footer a[href="/privacy"]')).toHaveCount(1)
    await expect(page.locator('footer a[href="/terms"]')).toHaveCount(1)
    // The hero image and the project artwork are in the HTML with descriptive alt text.
    await expect(page.locator('.st-hero__img')).toHaveAttribute('alt', /night-time city/)
    await expect(page.locator('#work .st-project__frame img')).toHaveAttribute('alt', /red hatchback/)
  })

  test('the legal pages and the Articles index render their text without scripts', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('h1')).toHaveText('Privacy Policy')
    expect(await page.locator('.st-legal h2').count()).toBeGreaterThanOrEqual(6)
    await expect(page.locator('main')).toContainText('Resend')
    await page.goto('/terms')
    await expect(page.locator('h1')).toHaveText('Terms of Use')
    await expect(page.locator('main')).toContainText('The Kanjo is an original DAINEKU project')
    await page.goto('/journal')
    await expect(page.locator('h1')).toHaveText('Inside the Process.')
    await expect(page.locator('main')).toContainText('Development notes, technical experiments')
  })
})

test.describe('status codes and links', () => {
  test('unknown URLs are real 404s, including legacy car slugs and never-built project routes', async ({ request }) => {
    for (const path of ['/cars/not-a-real-car', '/journal/not-a-real-article', '/projects/the-kanjo', '/projects', '/no-such-page', '/builds/no-such-style', '/parts/no-such-category']) {
      const { res, html: h } = await html(request, path)
      expect(res.status(), path).toBe(404)
      expect(head.robots(h).join(' '), path).toMatch(/noindex/)
    }
    // The 404 page is the studio’s own (title, copy and links home are in the response). Note:
    // for dynamically rendered routes Next.js ships the not-found body in the RSC payload of an
    // error shell rather than as plain HTML; the status is what keeps it out of the index.
    const h = (await html(request, '/no-such-page')).html
    expect(head.title(h)).toBe('Page not found | DAINEKU')
    expect(h).toContain('Page not found')
    expect(h).toContain('Studio home')
  })

  test('legacy automotive routes stay live but are noindex,follow with canonicals', async ({ request }) => {
    for (const path of ['/archive', '/builds', '/parts']) {
      const { res, html: h } = await html(request, path)
      expect(res.status(), path).toBe(200)
      expect(head.robots(h), path).toEqual(['noindex, follow'])
      expect(head.canonical(h), path).toBe(`${BASE}${path}`)
      expect(head.og(h, 'url'), path).toBe(`${BASE}${path}`)
      expect(head.og(h, 'title'), path).toBe(head.title(h))
      expect(head.description(h), path).toBeTruthy()
    }
    // The brand filter is a query variant of the archive, canonicalised to it.
    const { html: h } = await html(request, '/archive?brand=nissan')
    expect(head.canonical(h)).toBe(`${BASE}/archive`)
  })

  test('redirects are single hops with no loops; trailing slashes normalise', async ({ request }) => {
    const slash = await request.get('/journal/', { maxRedirects: 0 })
    expect(slash.status()).toBe(308)
    expect(slash.headers()['location']).toBe('/journal')
    expect((await request.get('/journal', { maxRedirects: 0 })).status()).toBe(200)
    const brand = await request.get('/?brand=nissan', { maxRedirects: 0 })
    expect(brand.status()).toBe(307)
    expect((await request.get(brand.headers()['location'], { maxRedirects: 0 })).status()).toBe(200)
  })

  test('every internal link on the studio pages resolves (200, or one redirect to a 200)', async ({ request }) => {
    const paths = new Set<string>()
    for (const start of ['/', '/journal', '/privacy', '/terms']) {
      const h = (await html(request, start)).html
      for (const m of h.matchAll(/<a[^>]+href="([^"]+)"/g)) {
        const href = m[1]
        if (href.startsWith('#')) continue
        if (/^(https?:|mailto:|tel:)/.test(href)) continue
        paths.add(href.split('#')[0] || '/')
      }
    }
    expect(paths.size).toBeGreaterThanOrEqual(4)
    for (const path of paths) {
      let res = await request.get(path, { maxRedirects: 0 })
      if (res.status() >= 300 && res.status() < 400) res = await request.get(res.headers()['location'], { maxRedirects: 0 })
      expect(res.status(), path).toBe(200)
    }
  })
})

test.describe('crawlable resources', () => {
  test('brand images, the hero candidates, stylesheets and scripts answer 200 with the right types', async ({ request }) => {
    for (const [path, type] of [['/images/brand/og.jpg', /image\/jpeg/], ['/images/brand/logo.png', /image\/png/], ['/favicon.ico', /image/], ['/apple-icon.png', /image\/png/]] as const) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(res.headers()['content-type'], path).toMatch(type)
    }
    const h = (await html(request, '/')).html
    const hero = h.match(/<img[^>]*class="st-hero__img"[^>]*>/)![0]
    const first = decode(hero.match(/srcSet="([^"]*)"/)![1])!.split(',')[0].trim().split(' ')[0]
    expect(first).toMatch(/^\/_next\/image\?/)
    const img = await request.get(first, { headers: { accept: 'image/avif,image/webp,*/*' } })
    expect(img.status()).toBe(200)
    expect(img.headers()['content-type']).toMatch(/^image\//)
    const css = [...h.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1])
    const js = [...h.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])
    expect(css.length).toBeGreaterThan(0)
    expect(js.length).toBeGreaterThan(0)
    for (const url of [css[0], js[0]]) expect((await request.get(url)).status(), url).toBe(200)
  })
})

test.describe('mobile rendering', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile project only')
  test('the homepage, index and legal pages have no horizontal overflow and one visible h1', async ({ page }: { page: Page }) => {
    for (const path of ['/', '/journal', '/privacy']) {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      const { scrollW, clientW } = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }))
      expect(scrollW, path).toBeLessThanOrEqual(clientW)
    }
  })
})
