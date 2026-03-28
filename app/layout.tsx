import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getSiteSettings } from '@/lib/data'
import { buildSiteConfig } from '@/lib/siteConfig'
import { getBaseUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteName = settings?.site_title || 'DAINEKU'
  const baseUrl  = getBaseUrl()

  // Non-production Vercel deployments (previews, branch deploys) are noindexed.
  // Production is determined by VERCEL_ENV=production or absence of VERCEL_ENV (local).
  const isNonProduction =
    process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== 'production'

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: settings?.default_seo_description || undefined,
    robots: isNonProduction
      ? { index: false, follow: false }
      : { index: true, follow: true },
    // Search Console verification — content= value only, rendered as meta tag
    ...(settings?.search_console_verification
      ? { verification: { google: settings.search_console_verification } }
      : {}),
    // Favicon from DB if set, else Next.js auto-detects app/favicon.ico
    ...(settings?.favicon_url
      ? { icons: { icon: settings.favicon_url } }
      : {}),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName,
      title: siteName,
      description: settings?.default_seo_description || undefined,
      images: settings?.default_og_image ? [settings.default_og_image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: settings?.default_seo_description || undefined,
      images: settings?.default_og_image ? [settings.default_og_image] : [],
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

  const siteConfig = buildSiteConfig(settings)

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {!isAdmin && <Header />}
        {children}
        {!isAdmin && <Footer config={siteConfig} />}
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
