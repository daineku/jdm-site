import { defineConfig, devices } from '@playwright/test'
import { randomBytes } from 'node:crypto'

/**
 * Smoke tests against a production build: `npm run build && npm run test:smoke`.
 *
 * The server is started with a throwaway ADMIN_SECRET_PATH generated per run, so the
 * admin-route checks never use (or need) the real secret. Supabase/R2 are not required:
 * data-dependent responses are mocked inside the tests where needed.
 */
const PORT = Number(process.env.SMOKE_PORT || 3400)
const adminPath = process.env.SMOKE_ADMIN_PATH || `smoke${randomBytes(20).toString('hex')}`
process.env.SMOKE_ADMIN_PATH = adminPath // visible to the test workers

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
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ADMIN_SECRET_PATH: adminPath },
  },
})
