/**
 * Contact delivery configuration and the release gate (lib/contactDelivery.ts).
 * Run: npm run test:contact-delivery
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { register } from 'node:module'

// The module imports its siblings without an extension (bundler style); resolve them to .ts.
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (/^\\.\\.?\\/[^.]+$/.test(specifier) && context.parentURL?.includes('/lib/')) return next(specifier + '.ts', context)
    return next(specifier, context)
  }
`))

const { getDeliveryConfig, isContactFormEnabled, isDeliveryConfigured } = await import('./contactDelivery.ts')

const KEYS = ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL', 'CONTACT_EMAIL', 'NEXT_PUBLIC_CONTACT_EMAIL', 'CONTACT_FORM_ENABLED', 'RESEND_API_URL']
function withEnv(env: Record<string, string>, fn: () => void) {
  const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]))
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, env)
  try { fn() } finally {
    for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k] }
  }
}

const READY = { RESEND_API_KEY: 're_test', CONTACT_FROM_EMAIL: 'DAINEKU <studio@daineku.com>', CONTACT_TO_EMAIL: 'owner@example.org' }

test('provider configured but the gate unset: delivery is configured, the form stays closed', () => {
  withEnv(READY, () => {
    assert.equal(isDeliveryConfigured(), true)
    assert.equal(isContactFormEnabled(), false)
  })
  for (const v of ['', 'false', '1', 'yes', 'TRUEISH']) withEnv({ ...READY, CONTACT_FORM_ENABLED: v }, () => assert.equal(isContactFormEnabled(), false, v))
})

test('the gate opens only with CONTACT_FORM_ENABLED=true and a complete provider configuration', () => {
  withEnv({ ...READY, CONTACT_FORM_ENABLED: 'true' }, () => assert.equal(isContactFormEnabled(), true))
  withEnv({ ...READY, CONTACT_FORM_ENABLED: ' TRUE ' }, () => assert.equal(isContactFormEnabled(), true))
  withEnv({ CONTACT_FORM_ENABLED: 'true', CONTACT_FROM_EMAIL: READY.CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL: READY.CONTACT_TO_EMAIL }, () => assert.equal(isContactFormEnabled(), false))
  withEnv({ CONTACT_FORM_ENABLED: 'true', RESEND_API_KEY: 're_test', CONTACT_TO_EMAIL: READY.CONTACT_TO_EMAIL }, () => assert.equal(isContactFormEnabled(), false))
})

test('the recipient comes from server configuration only; a malformed sender is refused', () => {
  withEnv(READY, () => {
    const cfg = getDeliveryConfig()
    assert.equal(cfg?.to, 'owner@example.org')
    assert.equal(cfg?.from, 'DAINEKU <studio@daineku.com>')
    assert.equal(cfg?.endpoint, 'https://api.resend.com/emails')
  })
  withEnv({ ...READY, CONTACT_TO_EMAIL: 'not-an-address', CONTACT_EMAIL: 'fallback@example.org' }, () => assert.equal(getDeliveryConfig()?.to, 'fallback@example.org'))
  withEnv({ ...READY, CONTACT_FROM_EMAIL: 'DAINEKU <studio@daineku.com>\nBcc: x@evil.example' }, () => assert.equal(getDeliveryConfig(), null))
})
