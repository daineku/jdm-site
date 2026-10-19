// Clears the Next.js data cache (unstable_cache entries under .next/cache) before the smoke
// server starts. The cache persists across builds and runs by design; the mock backend does
// not, so a stale entry from a previous run would otherwise describe articles that no longer
// exist. Production is unaffected — this runs only from playwright.config.ts.
import { rmSync } from 'node:fs'
rmSync('.next/cache/fetch-cache', { recursive: true, force: true })
