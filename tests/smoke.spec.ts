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
    for (let i = 0; i < 20 && (await page.locator('a.pgrid-card').count()) < 20; i++) {
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
