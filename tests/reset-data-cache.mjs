// Clears the Next.js data cache (unstable_cache entries under .next/cache) before the smoke
// server starts. The cache persists across builds and runs by design; the mock backend does
// not, so a stale entry from a previous run would otherwise describe articles that no longer
// exist. Production is unaffected — this runs only from playwright.config.ts.
//
// The homepage is statically generated at build time (ISR). `next build` runs without the smoke
// env (CONTACT_FORM_ENABLED, the mock backend), so its prerendered copy shows no contact form
// and no mock content; on Vercel build and runtime share one env, so this only matters here.
// Removing the prerendered files makes the first request render the page with the server's env,
// exactly as a revalidation would.
import { rmSync } from 'node:fs'
rmSync('.next/cache/fetch-cache', { recursive: true, force: true })
for (const f of ['index', 'journal']) for (const ext of ['html', 'rsc', 'meta', 'segments']) rmSync(`.next/server/app/${f}.${ext}`, { recursive: true, force: true })
