import type { Metadata } from 'next'
import StudioHero from '@/components/studio/StudioHero'
import StudioServices from '@/components/studio/StudioServices'
import SelectedWork from '@/components/studio/SelectedWork'
import JournalSection from '@/components/studio/JournalSection'
import ProcessSection from '@/components/studio/ProcessSection'
import StudioContact from '@/components/studio/StudioContact'
import Reveal from '@/components/studio/Reveal'
import { getSiteSettings } from '@/lib/data'
import { getHomepageArticles } from '@/lib/journal'
import { getBaseUrl } from '@/lib/seo'
import { isDeliveryConfigured } from '@/lib/contactDelivery'
import { getContactEmail, getSocialLinks } from '@/lib/social'

// Studio positioning is fixed here on purpose: the legacy JDM SEO defaults in
// site_settings still apply to the archive pages, but never to the studio homepage.
const TITLE = 'DAINEKU — Real-Time Simulation & Spatial Design Studio'
const DESCRIPTION =
  'DAINEKU develops real-time simulation, interactive 3D environments and cinematic visuals. Its racing game The Kanjo runs its own vehicle simulation, AI traffic, steering-wheel force feedback and night lighting.'
const OG_IMAGE = { url: '/images/brand/og.jpg', width: 1200, height: 630, alt: 'DAINEKU — a city at dusk, half wireframe, half finished' }

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
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
  const [settings, articles] = await Promise.all([getSiteSettings(), getHomepageArticles(3)])
  const socials = getSocialLinks(settings)
  const email = getContactEmail()
  const delivery = isDeliveryConfigured() ? 'server' : email ? 'mailto' : null
  const baseUrl = getBaseUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DAINEKU',
    url: `${baseUrl}/`,
    logo: `${baseUrl}/images/brand/logo.png`,
    description: DESCRIPTION,
    knowsAbout: ['Real-time simulation', 'Vehicle dynamics', 'AI traffic simulation', 'Interactive 3D environments', 'Real-time lighting and rendering', 'Cinematic video production'],
    ...(email ? { email } : {}),
    ...(socials.length ? { sameAs: socials.map(s => s.href) } : {}),
  }

  return (
    <main className="studio st-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <StudioHero />
      <StudioServices />
      <SelectedWork />
      <JournalSection articles={articles} />
      <ProcessSection />
      <StudioContact email={email} delivery={delivery} socials={socials} />
      <Reveal />
    </main>
  )
}
