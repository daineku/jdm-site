import type { Metadata } from 'next'
import Link from 'next/link'
import MasonryGallery from '@/components/MasonryGallery'
import { getBrands } from '@/lib/data'

// The original Daineku homepage feed — curated JDM photos, unchanged behaviour
// (manual first 6, shuffled remainder, infinite scroll), now living at /archive.
// Brand filter: /archive?brand=<slug>. Legacy /?brand=<slug> redirects here (next.config.ts).

export const metadata: Metadata = {
  title: 'JDM Archive',
  description: 'The Daineku editorial archive — a hand-curated feed of Japanese performance cars.',
  alternates: { canonical: '/archive' },
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
