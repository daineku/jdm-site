import { expect, test, type Page } from '@playwright/test'

const STUDIO_SECTIONS = ['services', 'work', 'contact']
/** Sections retired in the positioning review — they must not come back. */
const RETIRED_SECTIONS = ['why', 'technical', 'studio', 'process']

/**
 * The admin API rate-limits per client IP (lib/adminAuth.ts, 60/min). Locally every request
 * comes from one address, so each admin test identifies as its own client.
 */
let ipSeq = 0
const clientIp = () => `203.0.113.${(process.pid + ipSeq++ * 7 + Math.floor(Math.random() * 50)) % 250 + 1}`
const adminHeaders = (ip = clientIp()) => ({ 'x-admin-secret': process.env.SMOKE_ADMIN_PATH!, 'x-forwarded-for': ip })

/** Scroll the whole page so lazy images and reveals are triggered, then return to top. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
}

test.describe('studio homepage', () => {
  test('renders one H1, every section, no runtime errors, no broken images, no overflow', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Real-time simulation, interactive 3D environments, cinematic visuals.')
    for (const id of STUDIO_SECTIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1)
    for (const id of RETIRED_SECTIONS) await expect(page.locator(`#${id}`)).toHaveCount(0)

    await scrollThrough(page)
    await page.waitForLoadState('networkidle')

    const broken = await page.evaluate(() =>
      [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src))
    expect(broken).toEqual([])

    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }))
    expect(scrollW).toBeLessThanOrEqual(clientW)

    expect(errors).toEqual([])
  })

  test('primary CTA scrolls to Selected Work', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /explore the kanjo/i }).first().click()
    await expect(page).toHaveURL(/#work$/)
    await expect.poll(async () =>
      page.evaluate(() => Math.round(document.getElementById('work')!.getBoundingClientRect().top)),
    { timeout: 5000 }).toBeLessThanOrEqual(80)
  })

  test('no in-page anchor points at a missing section', async ({ page }) => {
    await page.goto('/')
    const missing = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('a[href^="#"], a[href^="/#"]')]
        .map(a => a.getAttribute('href')!.split('#')[1]).filter(Boolean)
      return [...new Set(ids)].filter(id => !document.getElementById(id))
    })
    expect(missing).toEqual([])
  })
})

test.describe('studio content', () => {
  test('the hero states what the studio builds, with no organisational slogan', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('.st-hero')
    await expect(hero.locator('.st-hero__disciplines li')).toHaveCount(3)
    for (const phrase of [/independent/i, /we build worlds/i, /by design/i]) await expect(page.locator('main')).not.toContainText(phrase)
  })

  test('capability cards are broad disciplines, not a fixed three-service offering', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('section#services')
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('What We Build')
    await expect(section.locator('h3')).toHaveText([/Simulation & Interactive Systems/, /3D Worlds & Spatial Design/, /Cinematic & Visual Production/])
    for (const card of await section.locator('.st-worlds__card').all()) {
      await expect(card.locator('.st-deliverables li')).toHaveCount(4)
    }
    await expect(section).not.toContainText(/Three services|scoped per project/i)
    await expect(section.locator('.st-worlds__card').first()).toContainText('Vehicle dynamics')
    await expect(section.locator('.st-worlds__card').first()).toContainText('AI traffic')
    // Generic interior/architectural design is no longer offered.
    await expect(section).not.toContainText(/architectur|interior/i)
  })

  test('section headings follow the agreed structure, in order', async ({ page }) => {
    await page.goto('/')
    // The Journal section and the Support module appear only while content is published / enabled
    // (journal and support tests may run in parallel).
    const h2 = (await page.locator('h2').allTextContents()).filter(t => t !== 'Inside the Process.' && t !== 'All articles' && !/support/i.test(t))
    expect(h2).toEqual(['What We Build', 'The Kanjo', 'Bring Your Next Project to Life.'])
    for (const gone of ['Production Capabilities', 'One World. Many Systems.', 'What The Kanjo Demonstrates.',
      'Built to Work. Designed to Feel Real.', 'Independent by Design.', 'A City Built to Move.']) {
      await expect(page.getByRole('heading', { name: gone })).toHaveCount(0)
    }
    // The annotated key-visual study does not show The Kanjo and must not return.
    await expect(page.locator('main')).not.toContainText(/Interior emissive|Concrete · glass/)
  })

  test('The Kanjo case study shows the real project artwork at full composition, never enlarged on screen', async ({ page, isMobile }) => {
    await page.goto('/')
    const work = page.locator('#work')
    await expect(work.getByRole('heading', { level: 2, name: 'The Kanjo' })).toBeVisible()
    await expect(work).toContainText('Highway racing, simulated in real time.')
    await expect(work).toContainText('Original project')
    await expect(work).toContainText('In development')
    const img = work.locator('.st-project__frame img')
    await expect(img).toHaveCount(1)
    await expect(img).toHaveAttribute('alt', /red hatchback.*expressway at night/i)
    // Art direction: a phone crop and the desktop master, both from the project's own artwork.
    await expect(work.locator('.st-project__frame picture source')).toHaveAttribute('srcset', /thekanjo-hero-mobile/)
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true)
    const src = await img.evaluate((i: HTMLImageElement) => i.currentSrc)
    expect(src).toMatch(isMobile ? /thekanjo-hero-mobile/ : /thekanjo-hero\.[a-f0-9]+\.jpg/)
    expect(src).not.toMatch(/brand%2Fhero|brand\/hero/)
    // The frame has the master's own aspect ratio, so cover neither crops nor scales it.
    const fit = await img.evaluate((i: HTMLImageElement) => {
      const r = i.getBoundingClientRect()
      const drawn = Math.max(r.width, r.height * (i.naturalWidth / i.naturalHeight)) * devicePixelRatio
      return { objectFit: getComputedStyle(i).objectFit, cssW: r.width, cssH: r.height, ratio: r.width / r.height, drawnDevicePx: drawn,
        delivered: Number(new URL(i.currentSrc).searchParams.get('w')) }
    })
    expect(fit.objectFit).toBe('cover')
    expect(fit.ratio).toBeCloseTo(isMobile ? 1560 / 1248 : 2592 / 1100, 1)
    // The delivered candidate is at least as wide as the drawn device pixels: no upscaling of the artwork.
    expect(fit.delivered).toBeGreaterThanOrEqual(Math.floor(fit.drawnDevicePx * 0.98))
  })

  test('The Kanjo shows only one project-level development label', async ({ page }) => {
    await page.goto('/')
    const work = page.locator('#work')
    await expect(work.locator('.st-project__frame .st-frame-tag--br')).toHaveText('In development')
    await expect(work.locator('.st-status')).toHaveCount(0)
    await expect(work.locator('.st-facts')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/Unity 6|Three services/)
    // No empty grid for "more projects" while only one project exists.
    await expect(work.locator('.st-projects__grid')).toHaveCount(0)
  })

  test('the technical summary is concise, grounded and free of individual statuses', async ({ page }) => {
    await page.goto('/')
    const systems = page.locator('#work .st-project__systems')
    await expect(systems.getByRole('heading', { level: 3, name: 'Inside the simulation' })).toBeVisible()
    await expect(systems.locator('h4')).toHaveText([
      'Vehicle Physics', 'Traffic & Racing AI', 'Wheel & Instrumentation', 'World & Rendering',
    ])
    await expect(systems.locator('.st-systems__list > li')).toHaveCount(4)
    await expect(systems.locator('.st-status, .st-deliverables')).toHaveCount(0)
    await expect(systems).toContainText('MOZA R3')
    await expect(systems.locator('a')).toHaveCount(0)
  })

  test('the Journal feed is advertised and valid RSS; it lists only published articles', async ({ page, request }) => {
    await page.goto('/')
    expect(await page.locator('link[rel="alternate"][type="application/rss+xml"]').getAttribute('href')).toMatch(/\/journal\/feed\.xml$/)
    const res = await request.get('/journal/feed.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/application\/rss\+xml/)
    const xml = await res.text()
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\s*<rss version="2.0"/)
    expect(xml).toContain('<title>DAINEKU Journal</title>')
    expect(xml).toContain('rel="self"')
    expect(xml).not.toMatch(/<script/i)
  })

  test('The Kanjo is linked exactly once, from the case study, as an external CTA', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('a[href*="thekanjo.com"]')
    await expect(links).toHaveCount(1)
    const cta = page.locator('#work').getByRole('link', { name: /explore the kanjo/i })
    await expect(cta).toHaveAttribute('href', 'https://www.thekanjo.com/')
    await expect(cta).toHaveAttribute('target', '_blank')
    await expect(cta).toHaveAttribute('rel', /noopener/)
  })

  test('hero CTAs lead to the work and to the contact section', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('.st-hero')
    await expect(hero.getByRole('link', { name: /explore the kanjo/i })).toHaveAttribute('href', '#work')
    await expect(hero.getByRole('link', { name: /discuss a project/i })).toHaveAttribute('href', '#contact')
  })

  test('the studio homepage carries no JDM branding; the archive stays reachable from the footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main')).not.toContainText(/\bJDM\b/)
    await expect(page.locator('header.st-header')).not.toContainText(/\bJDM\b/)
    await expect(page.locator('footer').getByRole('link', { name: 'Car archive' })).toHaveAttribute('href', '/archive')
  })

  test('public metadata: title, description, canonical, OpenGraph, Twitter, JSON-LD', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('DAINEKU — Real-Time Simulation & Spatial Design Studio')
    const meta = (sel: string) => page.locator(sel).first().getAttribute('content')
    expect(await meta('meta[name="description"]')).toMatch(/real-time simulation.*cinematic visuals.*The Kanjo/i)
    expect(await meta('meta[name="description"]')).not.toMatch(/independent/i)
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https:\/\/[^/]+\/?$/) // the site root
    expect(await meta('meta[property="og:title"]')).toBe('DAINEKU — Real-Time Simulation & Spatial Design Studio')
    expect(await meta('meta[property="og:image"]')).toMatch(/\/images\/brand\/og\.jpg$/)
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBe(0)
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}')
    expect(ld['@type']).toBe('Organization')
    expect(ld.name).toBe('DAINEKU')
  })
})

test.describe('responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'viewport sweep runs once, from the desktop project')
  for (const width of [1440, 1280, 768, 390, 360]) {
    test(`homepage at ${width}px: no overflow, no broken images`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await scrollThrough(page)
      await page.waitForLoadState('networkidle')
      const { scrollW, clientW, broken } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src),
      }))
      expect(scrollW).toBeLessThanOrEqual(clientW)
      expect(broken).toEqual([])
    })
  }
})

test.describe('project enquiry', () => {
  // Every test gets its own client address so the per-client rate limit never interferes.
  let n = 0
  const ip = () => `198.51.${Math.floor(Math.random() * 250)}.${(Date.now() + n++) % 250}`
  const mock = (q: string) => fetch(`${process.env.MOCK_RESEND_URL}/__find?q=${encodeURIComponent(q)}`)

  async function fillValid(page: Page, name: string) {
    const form = page.locator('form.st-form')
    await form.getByLabel('Name').fill(name)
    await form.getByLabel('Email').fill('client@example.org')
    await form.getByLabel('Project type').selectOption('Cinematic & Video Production')
    await form.getByLabel('Timeline (optional)').fill('Spring 2027')
    await form.getByLabel('Project description').fill('A launch film combining location footage with real-time city shots.')
    await page.waitForTimeout(2_700) // a person takes longer than the server's minimum fill time
  }

  test('invalid submit shows inline errors, focuses the first field and sends nothing', async ({ page }) => {
    const posts: string[] = []
    page.on('request', r => { if (r.url().endsWith('/api/contact')) posts.push(r.url()) })
    await page.goto('/#contact')
    const form = page.locator('form.st-form')
    await form.getByRole('button', { name: /send project enquiry/i }).click()
    await expect(form.locator('.st-field__error')).toHaveCount(4)
    await expect(form.getByLabel('Name')).toBeFocused()
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(4)
    expect(posts).toEqual([])
  })

  test('a valid enquiry is delivered to the configured inbox, with category subject and Reply-To', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': ip() })
    const name = `Smoke Client ${Date.now()}`
    await page.goto('/#contact')
    await fillValid(page, name)
    await page.locator('form.st-form').getByRole('button', { name: /send project enquiry/i }).click()
    await expect(page.locator('[data-status="sent"]')).toBeVisible()
    await expect(page.locator('form.st-form').getByLabel('Name')).toHaveValue('')

    const hit = await mock(name)
    expect(hit.status).toBe(200)
    const { authorized, body } = await hit.json()
    expect(authorized).toBe(true)
    expect(body.to).toEqual([process.env.SMOKE_INBOX])
    expect(body.reply_to).toBe('client@example.org')
    expect(body.subject).toBe(`Project enquiry — Cinematic & Video Production — ${name}`)
    expect(body.text).toContain('Spring 2027')
  })

  test('a provider failure is reported, never shown as success', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': ip() })
    await page.goto('/#contact')
    await fillValid(page, `PROVIDER-FAIL ${Date.now()}`)
    await page.locator('form.st-form').getByRole('button', { name: /send project enquiry/i }).click()
    await expect(page.locator('[data-status="error"]')).toContainText(/could not be sent/i)
    await expect(page.locator('[data-status="sent"]')).toHaveCount(0)
  })

  test('the endpoint ignores browser-supplied recipients and enforces its guards', async ({ request }) => {
    const base = {
      name: `Guard ${Date.now()}`, email: 'client@example.org', projectType: 'Other', timeline: '',
      message: 'Checking that the recipient cannot be chosen by the browser.', website: '', elapsedMs: 5_000,
    }
    const post = (data: object, headers: Record<string, string> = {}) =>
      request.post('/api/contact', { data, headers: { 'x-real-ip': ip(), ...headers } })

    const injected = await post({ ...base, to: 'attacker@example.org', recipient: 'attacker@example.org' })
    expect(injected.status()).toBe(200)
    expect((await (await mock(base.name)).json()).body.to).toEqual([process.env.SMOKE_INBOX])

    expect((await post({ ...base, name: `Fast ${Date.now()}`, elapsedMs: 300 })).status()).toBe(400)
    expect((await post({ ...base, projectType: 'Anything' })).status()).toBe(422)
    expect((await post(base, { origin: 'https://evil.example' })).status()).toBe(403)

    const bot = `Honeypot ${Date.now()}`
    expect((await post({ ...base, name: bot, website: 'https://spam.example' })).status()).toBe(200)
    expect((await mock(bot)).status).toBe(404) // accepted silently, never forwarded

    const same = ip()
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) statuses.push((await post({ ...base, name: `Burst ${i} ${Date.now()}` }, { 'x-real-ip': same })).status())
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(statuses[5]).toBe(429)
  })
})

test.describe('journal API access control', () => {
  test('every journal admin endpoint rejects a missing or wrong secret', async ({ request }) => {
    for (const secret of [undefined, 'wrong-secret']) {
      const ip = clientIp()
      const headers: Record<string, string> = secret ? { 'x-admin-secret': secret, 'x-forwarded-for': ip } : { 'x-forwarded-for': ip }
      expect((await request.get('/api/admin/journal', { headers })).status()).toBe(401)
      expect((await request.post('/api/admin/journal', { headers, data: { title: 'x', slug: 'x' } })).status()).toBe(401)
      expect((await request.put('/api/admin/journal', { headers, data: { id: crypto.randomUUID(), title: 'x' } })).status()).toBe(401)
      expect((await request.delete('/api/admin/journal', { headers, data: { id: crypto.randomUUID() } })).status()).toBe(401)
      expect((await request.put('/api/admin/journal/order', { headers, data: { ids: [crypto.randomUUID()] } })).status()).toBe(401)
      expect((await request.get('/api/admin/journal/media', { headers })).status()).toBe(401)
    }
  })

  test('the API validates slugs, rejects unknown fields and refuses to publish an empty article', async ({ request }) => {
    const headers = adminHeaders()
    const post = (data: object) => request.post('/api/admin/journal', { headers, data })
    expect((await post({ title: 'T', slug: 'Bad Slug!' })).status()).toBe(400)
    expect((await post({ title: 'T', slug: '-leading' })).status()).toBe(400)
    expect((await post({ title: 'T', slug: 'double--hyphen' })).status()).toBe(400)
    expect((await post({ title: 'T', slug: 'ok-slug', is_published: true })).status()).toBe(422) // no excerpt/body
    expect((await post({ title: 'T', slug: 'ok-slug', cover_image_url: 'https://evil.example/x.jpg', cover_alt: 'x' })).status()).toBe(400)
    expect((await post({ title: 'T', slug: 'ok-slug', role: 'admin' })).status()).toBe(400) // strict schema
    const slug = `validation-${Date.now()}`
    const created = await post({ title: 'Validation probe', slug })
    expect(created.status()).toBe(201)
    expect((await post({ title: 'Duplicate', slug })).status()).toBe(409)
    const { article } = await created.json()
    expect((await request.delete('/api/admin/journal', { headers, data: { id: article.id } })).status()).toBe(200)
  })
})

test.describe('journal', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(({ isMobile }) => isMobile, 'shared CMS state: runs once, from the desktop project')

  const stamp = Date.now()
  const slug = `night-lighting-notes-${stamp}`
  const title = `Night Lighting Notes ${stamp}`
  const admin = () => `/${process.env.SMOKE_ADMIN_PATH}`

  async function openJournalAdmin(page: Page) {
    page.on('dialog', d => d.accept())
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': clientIp() })
    await page.goto(admin())
    await page.getByRole('button', { name: /Journal$/ }).click()
    await expect(page.getByText('New article', { exact: true }).first()).toBeVisible()
  }

  test('no published article → no Journal section on the homepage, a restrained /journal', async ({ page, request }) => {
    const res = await request.get('/api/admin/journal', { headers: adminHeaders() })
    test.skip((await res.json()).articles.some((a: { is_published: boolean }) => a.is_published), 'articles already published in this run')
    await page.goto('/')
    await expect(page.locator('section#journal')).toHaveCount(0)
    await page.goto('/journal')
    await expect(page.locator('h1')).toHaveText('Inside the Process.')
    await expect(page.getByText('No articles have been published yet.')).toBeVisible()
    await expect(page.locator('.st-journal__card')).toHaveCount(0)
  })

  test('admin: create a draft with an uploaded cover; drafts stay private', async ({ page, request }) => {
    await openJournalAdmin(page)
    await page.getByLabel('Title').fill(title)
    await expect(page.getByLabel('Slug')).toHaveValue(slug)
    await page.getByLabel('Category').fill('Lighting')
    await page.getByLabel('Excerpt').fill('How street lights, paint and bloom were balanced for a night expressway.')
    await page.getByLabel('Body').fill([
      '## Why night is hard', '', 'Sodium lights, **wet asphalt** and car paint all fight for the same highlights.', '',
      '- Reflection probes', '- Lamp bloom', '', '[The Kanjo](https://www.thekanjo.com/)', '',
      '<script>window.__xss = 1</script>', '', '[click me](javascript:window.__xss=2)',
    ].join('\n'))
    await page.locator('input[type="file"]').setInputFiles('public/images/projects/thekanjo-hero-mobile.jpg')
    const coverPreview = page.locator('img[alt="preview"]')
    await expect(coverPreview).toBeVisible()
    expect(await coverPreview.getAttribute('src')).toMatch(new RegExp(`^${process.env.MOCK_BACKEND_URL}/media/journal/`))
    await page.getByLabel('Cover alt text').fill('A red hatchback on the expressway at night')

    // Preview renders the article with the public components, before anything is published.
    await page.getByRole('button', { name: 'Preview' }).click()
    const preview = page.getByTestId('journal-preview')
    await expect(preview.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(preview.getByRole('heading', { level: 2, name: 'Why night is hard' })).toBeVisible()
    await expect(preview.locator('strong')).toHaveText('wet asphalt')

    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Saved')).toBeVisible()
    await expect(page.getByTestId('journal-row').filter({ hasText: title })).toContainText('Draft')

    expect((await request.get(`/journal/${slug}`)).status()).toBe(404)
    await page.goto('/journal')
    await expect(page.getByText(title)).toHaveCount(0)
    await page.goto('/')
    await expect(page.getByText(title)).toHaveCount(0)
  })

  test('admin: publish → the article appears on /journal, its page, the homepage and the sitemap', async ({ page, request }) => {
    await openJournalAdmin(page)
    await page.getByTestId('journal-row').filter({ hasText: title }).getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText('Published', { exact: true }).first()).toBeVisible()

    await page.goto('/journal')
    // The first article is the lead story; any others are cards.
    const card = page.locator('.st-story, .st-journal__card').filter({ hasText: title })
    await expect(card).toHaveCount(1)
    await expect(card).toContainText('Lighting')
    await expect(card.locator('time')).toHaveText(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(new Date()))
    const cover = card.locator('img')
    await expect(cover).toHaveAttribute('alt', 'A red hatchback on the expressway at night')
    await expect.poll(() => cover.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true)

    await card.getByRole('link', { name: title }).click()
    await expect(page).toHaveURL(new RegExp(`/journal/${slug}$`))
    await expect(page.locator('h1')).toHaveText(title)
    await expect(page.locator('.st-prose h2')).toHaveText('Why night is hard')
    await expect(page.locator('.st-prose a[href="https://www.thekanjo.com/"]')).toHaveAttribute('rel', /noopener/)
    // Raw HTML and javascript: URLs never reach the page.
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    await expect(page.locator('.st-prose script')).toHaveCount(0)
    expect(await page.locator('.st-prose a', { hasText: 'click me' }).getAttribute('href')).not.toMatch(/javascript/i)
    await expect(page).toHaveTitle(`${title} — DAINEKU Journal`)
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(new RegExp(`/journal/${slug}$`))
    expect(await page.locator('meta[property="og:type"]').getAttribute('content')).toBe('article')
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}')
    expect(ld['@type']).toBe('Article')

    await page.goto('/')
    const home = page.locator('section#journal')
    await expect(home.getByRole('heading', { level: 2 })).toHaveText('Inside the Process.')
    await expect(home.getByRole('link', { name: title })).toHaveAttribute('href', `/journal/${slug}`)
    // One article → the featured story alone; no "latest" list and no empty placeholders.
    await expect(home.locator('.st-story')).toHaveCount(1)
    await expect(home.locator('.st-story')).toContainText('Featured story')
    await expect(home.locator('.st-story-row, .st-journal__card')).toHaveCount(0)
    await expect(home.locator('.st-story img')).toHaveAttribute('loading', 'lazy')

    expect(await (await request.get('/sitemap.xml')).text()).toContain(`/journal/${slug}`)
    const feed = await (await request.get('/journal/feed.xml')).text()
    expect(feed).toContain(`/journal/${slug}</link>`)
    expect(feed).toContain(`<category>Lighting</category>`)
  })

  test('admin: an edit is live immediately; the media library re-uses an uploaded cover', async ({ page }) => {
    await openJournalAdmin(page)
    await page.getByTestId('journal-row').filter({ hasText: title }).getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Excerpt').fill('Updated excerpt: balancing street lights, paint and bloom.')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Saved')).toBeVisible()

    // Second article picks its cover from the library instead of uploading.
    await page.getByRole('button', { name: 'New article' }).click()
    await page.getByLabel('Title').fill(`Library Cover ${stamp}`)
    await page.getByRole('button', { name: 'Choose from uploaded images' }).click()
    await page.getByTitle('Use as cover').first().click()
    await expect(page.locator('img[alt="preview"]')).toBeVisible()
    await page.getByLabel('Cover alt text').fill('Library image')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Saved')).toBeVisible()

    await page.goto('/journal')
    await expect(page.locator('.st-story, .st-journal__card').filter({ hasText: title })).toContainText('Updated excerpt')
  })

  test('admin: featured order, unpublish and delete are reflected publicly', async ({ page, request }) => {
    const headers = adminHeaders()
    const second = await (await request.post('/api/admin/journal', { headers, data: {
      title: `Traffic Notes ${stamp}`, slug: `traffic-notes-${stamp}`, excerpt: 'Lanes.', body: 'Body.', is_published: true, is_featured: true,
    } })).json()
    const { articles } = await (await request.get('/api/admin/journal', { headers })).json()
    const first = articles.find((a: { slug: string }) => a.slug === slug)
    await request.put('/api/admin/journal', { headers, data: { id: first.id, is_featured: true } })
    await request.put('/api/admin/journal/order', { headers, data: { ids: [second.article.id, first.id] } })
    await page.goto('/')
    // Two published articles: the first in featured order is the lead story, the other the "latest" list.
    await expect(page.locator('#journal .st-story .st-journal__title')).toHaveText(`Traffic Notes ${stamp}`)
    await expect(page.locator('#journal .st-story-row')).toHaveCount(1)
    await expect(page.locator('#journal .st-story-row .st-journal__title')).toHaveText(title)
    await expect(page.locator('#journal')).toContainText('Latest updates')
    await request.put('/api/admin/journal/order', { headers, data: { ids: [first.id, second.article.id] } })
    await page.goto('/')
    await expect(page.locator('#journal .st-story .st-journal__title')).toHaveText(title)
    await page.goto('/journal')
    await expect(page.locator('.st-story .st-journal__title')).toHaveText(title)
    await expect(page.locator('.st-journal__card')).toHaveCount(1)
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}')
    expect(ld['@type']).toBe('Blog')
    expect(ld.blogPost).toHaveLength(2)

    await openJournalAdmin(page)
    await page.getByTestId('journal-row').filter({ hasText: title }).getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Unpublish' }).click()
    await expect(page.getByText('Unpublished')).toBeVisible()
    expect((await request.get(`/journal/${slug}`)).status()).toBe(404)
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain(`/journal/${slug}`)

    // Clean up everything this run created, through the UI's delete (with its confirmation).
    for (const name of [title, `Library Cover ${stamp}`, `Traffic Notes ${stamp}`]) {
      await page.getByTestId('journal-row').filter({ hasText: name }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByTestId('journal-row').filter({ hasText: name })).toHaveCount(0)
    }
    await page.goto('/journal')
    await expect(page.getByText(String(stamp))).toHaveCount(0)
  })
})

test.describe('support module (Patreon)', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(({ isMobile }) => isMobile, 'shared settings row: runs once, from the desktop project')
  const headers = adminHeaders()
  const PATREON = 'https://www.patreon.com/daineku-smoke'
  let id = ''
  const put = (request: Parameters<Parameters<typeof test>[2]>[0]['request'], data: object) =>
    request.put('/api/admin/settings', { headers, data: { id, site_title: 'DAINEKU', tiktok_url: '', youtube_url: '', instagram_url: '', nav_links: [], ...data } })

  test('disabled by default: no Patreon markup anywhere on the site', async ({ page, request }) => {
    id = (await (await request.get('/api/admin/settings', { headers })).json()).settings.id
    await page.goto('/')
    await expect(page.locator('#support')).toHaveCount(0)
    expect(await page.content()).not.toMatch(/patreon/i)
  })

  test('the API accepts only patreon.com creator pages and known placements', async ({ request }) => {
    expect((await put(request, { support_enabled: true, support_url: 'https://evil.example/daineku' })).status()).toBe(400)
    expect((await put(request, { support_enabled: true, support_url: 'http://www.patreon.com/daineku' })).status()).toBe(400)
    expect((await put(request, { support_enabled: true, support_url: 'https://www.patreon.com/daineku?utm=1' })).status()).toBe(400)
    expect((await put(request, { support_placement: 'sidebar' })).status()).toBe(400)
    expect((await request.put('/api/admin/settings', { data: { id, support_enabled: true } })).status()).toBe(401)
  })

  test('enabled under the project: a native block with one external CTA and no third-party code', async ({ page, request }) => {
    expect((await put(request, { support_enabled: true, support_url: PATREON, support_project: 'thekanjo', support_placement: 'project', support_title: 'Fund the next build', support_body: 'Support goes into the game’s continued development.' })).status()).toBe(200)
    await page.goto('/')
    const block = page.locator('#work #support')
    await expect(block).toHaveCount(1)
    await expect(block).toContainText('Support The Kanjo')
    await expect(block.getByRole('heading', { level: 3, name: 'Fund the next build' })).toBeVisible()
    await expect(block).toContainText('continued development')
    const cta = block.getByRole('link', { name: /support development/i })
    await expect(cta).toHaveAttribute('href', PATREON)
    await expect(cta).toHaveAttribute('target', '_blank')
    await expect(cta).toHaveAttribute('rel', /noopener/)
    await expect(page.locator('a[href*="patreon.com"]')).toHaveCount(1)
    // The project's own artwork stands in for a dedicated image.
    await expect(block.locator('img')).toHaveAttribute('alt', /red hatchback/i)
    expect(await page.locator('iframe, script[src*="patreon"]').count()).toBe(0)
    await expect(page.locator('#journal #support')).toHaveCount(0)
  })

  test('placement "home" moves it to its own section; disabling removes it entirely', async ({ page, request }) => {
    expect((await put(request, { support_enabled: true, support_url: PATREON, support_project: '', support_placement: 'home' })).status()).toBe(200)
    await page.goto('/')
    await expect(page.locator('#work #support')).toHaveCount(0)
    const block = page.locator('main > section #support')
    await expect(block).toHaveCount(1)
    await expect(block.getByRole('heading', { level: 2 })).toBeVisible()
    await expect(block).toContainText('Support the studio')
    await expect(block.locator('img')).toHaveCount(0) // no project, no image → text layout

    expect((await put(request, { support_enabled: false })).status()).toBe(200)
    await page.goto('/')
    await expect(page.locator('#support')).toHaveCount(0)
    expect(await page.content()).not.toMatch(/patreon/i)
    // The rest of the settings row is untouched.
    const { settings } = await (await request.get('/api/admin/settings', { headers })).json()
    expect(settings.site_title).toBe('DAINEKU')
    expect(settings.support_url).toBe(PATREON)
  })
})

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only behaviour')

  test('menu opens, traps focus, closes on Escape and on link click', async ({ page }) => {
    await page.goto('/')
    const burger = page.locator('.st-burger')
    const menu = page.locator('#st-mobile-menu')

    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(menu).toBeVisible()
    await expect(menu.locator('a').first()).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeHidden()
    await expect(burger).toBeFocused()

    await burger.click()
    await menu.getByRole('link', { name: /the kanjo/i }).click()
    await expect(menu).toBeHidden()
    await expect(page).toHaveURL(/#work$/)
  })
})

test.describe('legacy routes', () => {
  test('legacy /?brand= links redirect to the archive, keeping the filter', async ({ request }) => {
    const res = await request.get('/?brand=nissan', { maxRedirects: 0 })
    expect(res.status()).toBe(307)
    expect(res.headers()['location']).toMatch(/\/archive\?brand=nissan$/)
  })

  test('archive paginates 11 then 6 then 6 with the brand filter (mocked API)', async ({ page }) => {
    const photos = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`, car_id: 'c1', url: '/images/brand/hero.png', thumb_url: '/images/brand/hero.png',
      orientation: i % 3 ? 'horizontal' : 'vertical', caption: `Photo ${i}`, alt_text: null,
      width: 1672, height: 941, show_on_home: true, is_visible: true, home_sort_order: i,
      car: { id: 'c1', title: 'Test Car', slug: 'test-car', brand: 'x', brand_id: 'b' },
    }))
    const calls: string[] = []
    await page.route('**/api/photos?*', route => {
      const q = new URL(route.request().url()).searchParams
      const offset = Number(q.get('offset')), limit = Number(q.get('limit'))
      calls.push(`${offset}/${limit}/${q.get('brand')}`)
      return route.fulfill({ json: { photos: photos.slice(offset, offset + limit) } })
    })

    await page.goto('/archive?brand=nissan')
    // At least the first batch. On a short viewport the scroll sentinel is already visible when it
    // renders, so the second batch may follow before a snapshot can see exactly 11 — the batch
    // sizes are asserted through the request sequence below instead.
    await expect.poll(() => page.locator('a.pgrid-card').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(11)
    // Scroll the document directly (mouse-wheel input is unreliable under touch emulation)
    // until the third batch has rendered.
    await expect.poll(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      return page.locator('a.pgrid-card').count()
    }, { timeout: 30_000, intervals: [300] }).toBe(20)
    expect(calls).toEqual(['0/11/nissan', '11/6/nissan', '17/6/nissan'])
    await expect(page.getByText('― end ―')).toBeVisible()
  })
})

test.describe('admin route', () => {
  test('an unknown single-segment path is a 404', async ({ request }) => {
    expect((await request.get('/definitely-not-the-admin-path')).status()).toBe(404)
    expect((await request.get(`/${process.env.SMOKE_ADMIN_PATH}x`)).status()).toBe(404)
  })

  test('the admin path renders the CMS without the studio header/footer', async ({ page }) => {
    const res = await page.goto(`/${process.env.SMOKE_ADMIN_PATH}`)
    expect(res?.status()).toBe(200)
    expect(res?.headers()['x-is-admin']).toBeUndefined()
    await expect(page.locator('.st-header')).toHaveCount(0)
    await expect(page.locator('.st-footer')).toHaveCount(0)
    await expect(page.locator('aside')).toHaveCount(1)
  })

  test('a spoofed x-is-admin header cannot hide the public header', async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { 'x-is-admin': '1' } })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.locator('.st-header')).toHaveCount(1)
    await ctx.close()
  })
})

test.describe('motion', () => {
  test('reduced motion: reveal is never armed, all content visible', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.classList.contains('st-reveal-ready'))).toBe(false)
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length)
    expect(hidden).toBe(0)
    await ctx.close()
  })

  test('default motion: below-fold content reveals once scrolled into view', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const target = page.locator('#work .st-systems__list [data-reveal]').first()
    await expect(target).not.toHaveClass(/is-in/)
    await target.scrollIntoViewIfNeeded()
    await expect(target).toHaveClass(/is-in/)
    await expect(target).toHaveCSS('opacity', '1')
  })
})
