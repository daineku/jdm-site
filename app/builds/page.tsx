import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getPublishedBuildCategories, getSiteSettings } from '@/lib/data'
import { resolveSeoTitle, resolveSeoDescription, getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = resolveSeoTitle('Build Styles', 'Build Styles', settings)
  const canonical = `${getBaseUrl()}/builds`
  return {
    title,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title },
  }
}

export default async function BuildsPage() {
  const categories = await getPublishedBuildCategories()

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Build Styles
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 48 }}>
          Browse JDM builds by style category.
        </p>

        {categories.length === 0 && (
          <p style={{ color: '#444', fontSize: 14 }}>No build categories published yet.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/builds/${cat.slug}`}
              style={{ display: 'block', background: '#111', border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden', textDecoration: 'none' }}>

              {/* Image or graceful placeholder */}
              {cat.image_url ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '56%', background: '#0a0a0a' }}>
                  <Image src={cat.image_url} alt={cat.name} fill style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{
                  width: '100%', paddingTop: '56%', position: 'relative',
                  background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#2a2a2a', textTransform: 'uppercase' }}>
                      {cat.name}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ padding: '16px 18px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{cat.name}</p>
                {cat.description && (
                  <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.5 }}>{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
