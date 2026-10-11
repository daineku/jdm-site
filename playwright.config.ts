import { defineConfig, devices } from '@playwright/test'
import { randomBytes } from 'node:crypto'

/**
 * Smoke tests against a production build: `npm run build && npm run test:smoke`.
 *
 * The server is started with a throwaway ADMIN_SECRET_PATH generated per run, so the
 * admin-route checks never use (or need) the real secret. Supabase/R2 are not required:
 * data-dependent responses are mocked inside the tests where needed. Contact delivery
 * goes to tests/mock-resend.mjs, never to a real provider or inbox.
 */
const PORT = Number(process.env.SMOKE_PORT || 3400)
const adminPath = process.env.SMOKE_ADMIN_PATH || `smoke${randomBytes(20).toString('hex')}`
process.env.SMOKE_ADMIN_PATH = adminPath // visible to the test workers
const MOCK_PORT = Number(process.env.MOCK_RESEND_PORT || 3499)
const SMOKE_INBOX = 'studio-inbox@smoke.invalid'
process.env.SMOKE_INBOX = SMOKE_INBOX
process.env.MOCK_RESEND_URL = `http://127.0.0.1:${MOCK_PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    {
      // Local stand-in for the email provider — the contact flow is exercised end to end
      // against it, so these runs prove the app's delivery code, not real Resend delivery.
      command: `node tests/mock-resend.mjs`,
      url: `http://127.0.0.1:${MOCK_PORT}/__health`,
      reuseExistingServer: false,
      env: { MOCK_RESEND_PORT: String(MOCK_PORT) },
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/robots.txt`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ADMIN_SECRET_PATH: adminPath,
        // Reserved .invalid domain: a test-only inbox that can never receive mail.
        CONTACT_EMAIL: SMOKE_INBOX,
        CONTACT_FROM_EMAIL: 'DAINEKU Smoke <sender@smoke.invalid>',
        RESEND_API_KEY: 'smoke-test-key',
        RESEND_API_URL: `http://127.0.0.1:${MOCK_PORT}/emails`,
      },
    },
  ],
})
