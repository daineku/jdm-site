import type { MetadataRoute } from 'next'
import { getBaseUrl, isProductionDeployment, robotsRules } from '@/lib/seo'

/**
 * Production: everything crawlable except the API routes. `/_next/` is deliberately not blocked —
 * Google renders pages with the JavaScript, CSS and optimised images served under it, and
 * blocking them makes the rendered page look empty to the indexer. Query-parameter variants of
 * the archive carry a canonical to /archive instead of a robots rule. The admin path is secret:
 * listing it here would publish it, so it is noindexed through its own metadata.
 * Previews and branch deployments: nothing crawlable, no sitemap (see lib/seo.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return robotsRules(isProductionDeployment(), getBaseUrl())
}
