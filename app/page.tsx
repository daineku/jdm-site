import type { Metadata } from 'next'
import StudioHero from '@/components/studio/StudioHero'
import RealTimeWorlds from '@/components/studio/RealTimeWorlds'
import DesignExperience from '@/components/studio/DesignExperience'
import SelectedWork from '@/components/studio/SelectedWork'
import ExpertiseGrid from '@/components/studio/ExpertiseGrid'
import BehindSimulation from '@/components/studio/BehindSimulation'
import ProcessSection from '@/components/studio/ProcessSection'
import StudioAbout from '@/components/studio/StudioAbout'
import StudioContact from '@/components/studio/StudioContact'
import Reveal from '@/components/studio/Reveal'
import { getSiteSettings } from '@/lib/data'
import { getBaseUrl } from '@/lib/seo'
import { getContactEmail, getSocialLinks } from '@/lib/social'

// Studio positioning is fixed here on purpose: the legacy JDM SEO defaults in
// site_settings still apply to the archive pages, but never to the studio homepage.
const TITLE = 'DAINEKU — Real-Time Simulation & Spatial Design Studio'
const DESCRIPTION =
  'DAINEKU is an independent creative technology studio specialising in real-time simulation, digital environments, spatial design and interactive experiences.'
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
  const settings = await getSiteSettings()
  const socials = getSocialLinks(settings)
  const email = getContactEmail()
  const baseUrl = getBaseUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DAINEKU',
    url: `${baseUrl}/`,
    logo: `${baseUrl}/images/brand/logo.png`,
    description: DESCRIPTION,
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
      <RealTimeWorlds />
      <DesignExperience />
      <SelectedWork />
      <ExpertiseGrid />
      <BehindSimulation />
      <ProcessSection />
      <StudioAbout />
      <StudioContact email={email} socials={socials} />
      <Reveal />
    </main>
  )
}
