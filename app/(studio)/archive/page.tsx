import type { Metadata } from 'next'
import Link from 'next/link'
import MasonryGallery from '@/components/MasonryGallery'
import { getBrands } from '@/lib/data'
import { legacyRobots } from '@/lib/seo'

// The original Daineku homepage feed — curated JDM photos, unchanged behaviour
// (manual first 6, shuffled remainder, infinite scroll), now living at /archive.
// Brand filter: /archive?brand=<slug>. Legacy /?brand=<slug> redirects here (next.config.ts).

const TITLE = 'JDM Archive'
const DESCRIPTION = 'The Daineku editorial archive — a hand-curated feed of Japanese performance cars.'

// Legacy route: live, but out of the studio's index and sitemap by default (lib/seo.ts).
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/archive' },
  robots: legacyRobots(),
  openGraph: { type: 'website', url: '/archive', siteName: 'DAINEKU', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
  twitter: { card: 'summary', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
}

type Props = { searchParams: Promise<{ brand?: string | string[] }> }

export default async function ArchivePage({ searchParams }: Props) {
  const raw = (await searchParams).brand
  const brand = (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined
  const brands = await getBrands()
  const activeBrand = brands.find(b => b.slug === brand)

  return (
    <main className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      <div className="studio">
        <div className="st-container st-archive-head">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>Editorial archive</p>
          <h1 className="st-h2">{activeBrand ? activeBrand.name : 'JDM Archive'}</h1>
          {brands.length > 0 && (
            <nav aria-label="Filter by brand">
              <ul className="st-filters">
                <li>
                  <Link href="/archive" className="st-filter" aria-current={!brand ? 'page' : undefined} prefetch={false}>All</Link>
                </li>
                {brands.map(b => (
                  <li key={b.id}>
                    <Link
                      href={`/archive?brand=${encodeURIComponent(b.slug)}`}
                      className="st-filter"
                      aria-current={brand === b.slug ? 'page' : undefined}
                      prefetch={false}
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-6">
        <MasonryGallery key={brand ?? 'all'} brandFilter={brand} />
      </div>
    </main>
  )
}
