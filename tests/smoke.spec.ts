import { expect, test, type Page } from '@playwright/test'

const STUDIO_SECTIONS = ['work', 'expertise', 'process', 'studio', 'contact']

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
    await expect(page.locator('h1')).toHaveText(/We build worlds that feel real\./i)
    for (const id of STUDIO_SECTIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1)

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
    await page.getByRole('link', { name: /explore our work/i }).first().click()
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
  test('What We Make presents exactly the three service pillars', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('section[aria-labelledby="worlds-title"]')
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('What We Make')
    await expect(section.locator('h3')).toHaveText([
      /Interactive Simulations/, /Digital Environments/, /Cinematic & Video Production/,
    ])
  })

  test('section headings follow the approved structure', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2')).toContainText([
      'What We Make', 'Designed as One Experience.', 'Selected Work', 'Production Capabilities',
      'One World. Many Systems.', 'From Idea to Delivery.', 'Independent by Design.', "Let's Build Something.",
    ])
    await expect(page.locator('#expertise li')).toHaveCount(6)
    await expect(page.locator('#process ol > li')).toHaveCount(4)
  })

  test('The Kanjo is presented as original IP in development, linking to its verified site', async ({ page }) => {
    await page.goto('/')
    const work = page.locator('#work')
    await expect(work.getByRole('heading', { name: 'A City Built to Move.' })).toBeVisible()
    await expect(work).toContainText('Original IP')
    await expect(work).toContainText('In development')
    const cta = work.getByRole('link', { name: /view the kanjo/i })
    await expect(cta).toHaveAttribute('href', 'https://www.thekanjo.com/')
    await expect(cta).toHaveAttribute('target', '_blank')
    await expect(cta).toHaveAttribute('rel', /noopener/)
  })

  test('hero CTAs lead to the work and to the contact section', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('.st-hero')
    await expect(hero.getByRole('link', { name: /explore our work/i })).toHaveAttribute('href', '#work')
    await expect(hero.getByRole('link', { name: /discuss a project/i })).toHaveAttribute('href', '#contact')
  })

  test('public metadata: title, description, canonical, OpenGraph, Twitter, JSON-LD', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('DAINEKU — Real-Time Simulation & Spatial Design Studio')
    const meta = (sel: string) => page.locator(sel).first().getAttribute('content')
    expect(await meta('meta[name="description"]')).toMatch(/independent development studio.*cinematic video production/i)
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

test.describe('project enquiry', () => {
  // Every test gets its own client address so the per-client rate limit never interferes.
  let n = 0
  const ip = () => `198.51.${Math.floor(Math.random() * 250)}.${(Date.now() + n++) % 250}`
  const mock = (q: string) => fetch(`${process.env.MOCK_RESEND_URL}/__find?q=${encodeURIComponent(q)}`)

  async function fillValid(page: Page, name: string) {
    const form = page.locator('form.st-form')
    await form.getByLabel('Name').fill(name)
    await form.getByLabel('Email').fill('client@example.org')
    await form.getByLabel('Project type').selectOption('Cinematic & Video')
    await form.getByLabel('Timeline (optional)').fill('Spring 2027')
    await form.getByLabel('Project description').fill('A launch film combining location footage with real-time city shots.')
    await page.waitForTimeout(2_700) // a person takes longer than the server's minimum fill time
  }

  test('invalid submit shows inline errors, focuses the first field and sends nothing', async ({ page }) => {
    const posts: string[] = []
    page.on('request', r => { if (r.url().endsWith('/api/contact')) posts.push(r.url()) })
    await page.goto('/#contact')
    const form = page.locator('form.st-form')
    await form.getByRole('button', { name: /discuss a project/i }).click()
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
    await page.locator('form.st-form').getByRole('button', { name: /discuss a project/i }).click()
    await expect(page.locator('[data-status="sent"]')).toBeVisible()
    await expect(page.locator('form.st-form').getByLabel('Name')).toHaveValue('')

    const hit = await mock(name)
    expect(hit.status).toBe(200)
    const { authorized, body } = await hit.json()
    expect(authorized).toBe(true)
    expect(body.to).toEqual([process.env.SMOKE_INBOX])
    expect(body.reply_to).toBe('client@example.org')
    expect(body.subject).toBe(`Project enquiry — Cinematic & Video — ${name}`)
    expect(body.text).toContain('Spring 2027')
  })

  test('a provider failure is reported, never shown as success', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': ip() })
    await page.goto('/#contact')
    await fillValid(page, `PROVIDER-FAIL ${Date.now()}`)
    await page.locator('form.st-form').getByRole('button', { name: /discuss a project/i }).click()
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
    await menu.getByRole('link', { name: /process/i }).click()
    await expect(menu).toBeHidden()
    await expect(page).toHaveURL(/#process$/)
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
    await expect(page.locator('a.pgrid-card')).toHaveCount(11)
    // Scroll the document directly (mouse-wheel input is unreliable under touch emulation)
    // until the third batch has rendered.
    for (let i = 0; i < 40 && (await page.locator('a.pgrid-card').count()) < 20; i++) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(300)
    }
    await expect(page.locator('a.pgrid-card')).toHaveCount(20)
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
    const target = page.locator('#studio [data-reveal]').first()
    await expect(target).not.toHaveClass(/is-in/)
    await target.scrollIntoViewIfNeeded()
    await expect(target).toHaveClass(/is-in/)
    await expect(target).toHaveCSS('opacity', '1')
  })
})
