import type { Metadata } from 'next'
import StudioHero from '@/components/studio/StudioHero'
import StudioServices from '@/components/studio/StudioServices'
import ProjectsSection from '@/components/studio/ProjectsSection'
import JournalSection from '@/components/studio/JournalSection'
import SupportModule from '@/components/studio/SupportModule'
import StudioContact from '@/components/studio/StudioContact'
import Reveal from '@/components/studio/Reveal'
import { getSiteSettings } from '@/lib/data'
import { getHomepageArticles } from '@/lib/journal'
import { STUDIO_DESCRIPTION, STUDIO_TITLE, getBaseUrl } from '@/lib/seo'
import { JsonLd, organizationNode, projectNode, serviceNodes, webSiteNode } from '@/lib/jsonld'
import { getVisibleProjects } from '@/lib/projects'
import { isContactFormEnabled } from '@/lib/contactDelivery'
import { getSocialLinks } from '@/lib/social'
import { resolveSupport } from '@/lib/support'

// Studio positioning is fixed here on purpose: the legacy JDM SEO defaults in
// site_settings still apply to the archive pages, but never to the studio homepage.
// Shared with the root layout's defaults (lib/seo.ts) so no legacy JDM text can reach studio pages.
const TITLE = STUDIO_TITLE
const DESCRIPTION = STUDIO_DESCRIPTION
const OG_IMAGE = { url: '/images/brand/og.jpg', width: 1200, height: 630, alt: 'DAINEKU: a city at dusk, half wireframe, half finished' }

// Statically generated and served from the CDN. Regenerated every five minutes, and at once
// when the admin writes settings or articles (the cached reads are tagged, lib/data.ts and
// lib/journal.ts). Nothing here reads request data.
export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/', types: { 'application/rss+xml': '/journal/feed.xml' } },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'DAINEKU',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
}

export default async function Home() {
  // getSiteSettings is request-cached: the layout already fetched it, so this is free.
  const [settings, articles] = await Promise.all([getSiteSettings(), getHomepageArticles(4)])
  const socials = getSocialLinks(settings)
  const deliveryReady = isContactFormEnabled()
  const support = resolveSupport(settings)
  const baseUrl = getBaseUrl()

  // One graph: the studio, its website and each visible project (The Kanjo as the studio's own
  // racing simulation in development). Everything stated here is also visible on the page.
  const graph = [
    organizationNode(baseUrl, socials.map(s => s.href)),
    webSiteNode(baseUrl),
    ...serviceNodes(baseUrl),
    ...getVisibleProjects().map(p => projectNode(baseUrl, p)),
  ]

  return (
    <main className="studio st-main">
      <JsonLd nodes={graph} />
      <StudioHero />
      <StudioServices />
      <ProjectsSection support={support} />
      <JournalSection articles={articles} />
      {support?.placement === 'home' && <SupportModule config={support} variant="home" />}
      <StudioContact deliveryReady={deliveryReady} socials={socials} />
      <Reveal />
    </main>
  )
}
