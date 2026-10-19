import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import localFont from 'next/font/local'
import './globals.css'
import '@/components/studio/studio.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getSiteSettings } from '@/lib/data'
import { STUDIO_DESCRIPTION, STUDIO_TITLE, getBaseUrl, isProductionDeployment } from '@/lib/seo'
import { getSocialLinks } from '@/lib/social'

// Studio display face, self-hosted from app/fonts (SIL OFL). Committed file + next/font/local
// rather than next/font/google (whose 15.3.6 loader crashes on current Google responses).
const display = localFont({
  src: './fonts/SpaceGrotesk-Variable-latin.woff2',
  weight: '300 700',
  variable: '--font-display',
  display: 'swap',
})
// Body face (Manrope) is declared once in globals.css under its real family name.

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const baseUrl  = getBaseUrl()

  // Non-production Vercel deployments (previews, branch deploys) are noindexed; robots.txt
  // disallows them too (lib/seo.ts). Production emits no robots meta of its own: indexable is
  // the default, and a page that opts out (404, admin, legacy archive) then carries one
  // directive instead of two conflicting ones.
  const production = isProductionDeployment()

  // Studio defaults come from code (lib/seo.ts), never from the legacy site_settings SEO fields,
  // so a stale JDM description or OG image cannot reach a studio page. Pages override as needed.
  // Icons are the app/ file conventions (favicon.ico, icon.png, apple-icon.png); the old
  // site_settings.favicon_url override is deliberately not read any more.
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: STUDIO_TITLE,
      template: '%s | DAINEKU',
    },
    description: STUDIO_DESCRIPTION,
    applicationName: 'DAINEKU',
    ...(production ? {} : { robots: { index: false, follow: false } }),
    // Search Console verification — content= value only, rendered as meta tag
    ...(settings?.search_console_verification
      ? { verification: { google: settings.search_console_verification } }
      : {}),
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      siteName: 'DAINEKU',
      title: STUDIO_TITLE,
      description: STUDIO_DESCRIPTION,
      images: ['/images/brand/og.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: STUDIO_TITLE,
      description: STUDIO_DESCRIPTION,
      images: ['/images/brand/og.jpg'],
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  // GA4: only load when measurement ID is set and matches the expected format
  const ga4Id = settings?.ga4_measurement_id?.match(/^G-[A-Z0-9]{4,20}$/)
    ? settings.ga4_measurement_id
    : null

  // Middleware sets x-is-admin for the admin route.
  // Read server-side — no client flicker, no DOM hacks.
  const headersList = await headers()
  const isAdmin = headersList.get('x-is-admin') === '1'

  const socials = getSocialLinks(settings)

  return (
    <html lang="en" className={display.variable}>
      <body>
        {!isAdmin && <Header socials={socials} />}
        {isAdmin ? children : <div id="main" tabIndex={-1} style={{ outline: 'none' }}>{children}</div>}
        {!isAdmin && <Footer />}
        {/* GA4 — afterInteractive so it never blocks page render */}
        {ga4Id && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  )
}
