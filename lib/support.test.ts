/**
 * Unit tests for the Support module configuration (lib/support.ts).
 * Run: npm run test:support
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SUPPORT_DEFAULTS, isSupportUrl, resolveSupport } from './support.ts'

test('only https creator pages on patreon.com are accepted', () => {
  for (const ok of ['https://www.patreon.com/daineku', 'https://patreon.com/daineku/', 'https://www.patreon.com/c/daineku', 'https://www.patreon.com/cw/daineku', 'https://www.patreon.com/join/daineku']) {
    assert.ok(isSupportUrl(ok), ok)
  }
  for (const bad of [
    '', 'daineku', 'http://www.patreon.com/daineku', 'https://patreon.com.evil.example/daineku', 'https://evil.example/patreon.com/daineku',
    'https://www.patreon.com/', 'https://www.patreon.com/daineku?ref=x', 'https://www.patreon.com/daineku#x', 'https://user:pw@www.patreon.com/daineku',
    'https://www.patreon.com/a/b/c', 'https://www.patreon.com:8443/daineku', 'javascript:alert(1)', 'https://www.patreon.com/<script>',
  ]) assert.ok(!isSupportUrl(bad), bad)
})

test('disabled by default: no settings and no environment → null', () => {
  assert.equal(resolveSupport(null, {}), null)
  assert.equal(resolveSupport({}, {}), null)
  assert.equal(resolveSupport({ support_enabled: null }, {}), null)
})

test('settings decide once the columns exist, including an explicit "off" over the environment', () => {
  const env = { PATREON_URL: 'https://www.patreon.com/env' }
  assert.equal(resolveSupport({ support_enabled: false, support_url: 'https://www.patreon.com/db' }, env), null)
  const on = resolveSupport({ support_enabled: true, support_url: 'https://www.patreon.com/db', support_title: ' Fund The Kanjo ', support_project: 'thekanjo', support_placement: 'home' }, env)
  assert.equal(on?.url, 'https://www.patreon.com/db')
  assert.equal(on?.title, 'Fund The Kanjo')
  assert.equal(on?.project, 'thekanjo')
  assert.equal(on?.placement, 'home')
  // enabled but with an invalid destination → nothing is rendered
  assert.equal(resolveSupport({ support_enabled: true, support_url: 'https://evil.example/x' }, env), null)
  assert.equal(resolveSupport({ support_enabled: true, support_url: null }, env), null)
})

test('environment fallback applies safe defaults and sanitises optional fields', () => {
  const cfg = resolveSupport(null, {
    PATREON_URL: ' https://www.patreon.com/daineku ',
    SUPPORT_BODY: 'Line one\nline two',
    SUPPORT_IMAGE_URL: 'http://insecure.example/x.jpg',
    SUPPORT_PROJECT: 'Not A Slug',
    SUPPORT_PLACEMENT: 'sidebar',
  })
  assert.ok(cfg)
  assert.equal(cfg.url, 'https://www.patreon.com/daineku')
  assert.equal(cfg.title, SUPPORT_DEFAULTS.title)
  assert.equal(cfg.cta, SUPPORT_DEFAULTS.cta)
  assert.equal(cfg.body, 'Line one line two')
  assert.equal(cfg.imageUrl, null)
  assert.equal(cfg.project, null)
  assert.equal(cfg.placement, SUPPORT_DEFAULTS.placement)
  assert.equal(cfg.provider, 'patreon')
})

test('defaults never state tiers, prices or benefits', () => {
  for (const s of Object.values(SUPPORT_DEFAULTS)) assert.doesNotMatch(String(s), /\$|€|£|tier|per month|benefit|reward|exclusive/i)
})
