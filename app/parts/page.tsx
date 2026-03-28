import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPartCategories, getSiteSettings } from '@/lib/data'
import { resolveSeoTitle, getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = resolveSeoTitle('Aftermarket Parts', 'Aftermarket Parts', settings)
  const canonical = `${getBaseUrl()}/parts`
  return {
    title,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title },
  }
}

export default async function PartsPage() {
  const categories = await getPublishedPartCategories()

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Aftermarket Parts
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 48 }}>
          Browse curated aftermarket parts by category.
        </p>

        {categories.length === 0 && (
          <p style={{ color: '#444', fontSize: 14 }}>No part categories published yet.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/parts/${cat.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#111', border: '1px solid #1e1e1e', borderRadius: 4, padding: '16px 18px', textDecoration: 'none' }}>

              {/* Image or placeholder */}
              {cat.image_url ? (
                <div style={{ width: 48, height: 48, position: 'relative', flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
                  <Image src={cat.image_url} alt={cat.name} fill style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 3, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#333', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {cat.name.slice(0, 3)}
                  </span>
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{cat.name}</p>
                {cat.description && (
                  <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0', lineHeight: 1.4 }}>{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
