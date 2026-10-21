import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import '@/components/studio/studio.css'
import { getSiteSettings } from '@/lib/data'
import { STUDIO_DESCRIPTION, STUDIO_TITLE, getBaseUrl, isProductionDeployment } from '@/lib/seo'

// Both typefaces are self-hosted from public/fonts (SIL OFL) and declared in globals.css under
// their real family names. The two Latin files every page uses are preloaded in <head> below,
// so the browser fetches them with the HTML instead of after the stylesheet has been parsed.
// (next/font/local was used for the display face before; its preload only ever reached the
// browser as a response header on dynamically rendered pages, which these no longer are.)

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

/**
 * Root layout: document, fonts and analytics only. It reads no request data, so every public
 * page can be statically generated and served from the CDN. The studio header and footer live
 * in app/(studio)/layout.tsx; the admin route (app/[adminPath]) renders without them.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  // GA4: only load when measurement ID is set and matches the expected format
  const ga4Id = settings?.ga4_measurement_id?.match(/^G-[A-Z0-9]{4,20}$/)
    ? settings.ga4_measurement_id
    : null

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/SpaceGrotesk-Variable-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Manrope-Variable-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
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
