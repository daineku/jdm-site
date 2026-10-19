import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEGAL_UPDATED, isLegacyArchiveIndexable, isProductionDeployment, legacyRobots, robotsRules } from './seo.ts'

// Indexing policy for the deployment kinds the site runs as. The Playwright suite exercises the
// production shape against a built server; the preview shape is proved here because the suite
// starts one server only.

test('production is the Vercel production deployment or a plain next start', () => {
  assert.equal(isProductionDeployment({}), true)
  assert.equal(isProductionDeployment({ VERCEL_ENV: 'production' }), true)
  assert.equal(isProductionDeployment({ VERCEL_ENV: 'preview' }), false)
  assert.equal(isProductionDeployment({ VERCEL_ENV: 'development' }), false)
})

test('production robots: everything crawlable except the API, /_next/ never blocked, sitemap advertised', () => {
  const r = robotsRules(true, 'https://daineku.com')
  assert.deepEqual(r.rules, [{ userAgent: '*', allow: '/', disallow: ['/api/'] }])
  assert.equal(r.sitemap, 'https://daineku.com/sitemap.xml')
  const disallowed = r.rules.flatMap(rule => [rule.disallow ?? []].flat())
  for (const needed of ['/_next/static/chunks/app.js', '/_next/image?url=x', '/images/brand/og.jpg', '/journal/feed.xml']) {
    assert.ok(!disallowed.some(d => needed.startsWith(d)), `${needed} must stay crawlable`)
  }
})

test('preview robots: nothing crawlable and no sitemap', () => {
  const r = robotsRules(false, 'https://preview.vercel.app')
  assert.deepEqual(r.rules, [{ userAgent: '*', disallow: '/' }])
  assert.equal(r.sitemap, undefined)
})

test('legacy archive is noindex,follow unless the owner opts back in', () => {
  assert.equal(isLegacyArchiveIndexable({}), false)
  assert.deepEqual(legacyRobots({}), { index: false, follow: true })
  assert.equal(isLegacyArchiveIndexable({ LEGACY_ARCHIVE_INDEXABLE: 'true' }), true)
  assert.equal(legacyRobots({ LEGACY_ARCHIVE_INDEXABLE: 'true' }), undefined)
  assert.equal(isLegacyArchiveIndexable({ LEGACY_ARCHIVE_INDEXABLE: 'yes' }), false)
})

test('legal document dates are real ISO dates in the past', () => {
  for (const d of Object.values(LEGAL_UPDATED)) {
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(Date.parse(d) <= Date.now())
  }
})
