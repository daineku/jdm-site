import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getBuildCategoryBySlug, getPhotosForBuildCategory, getSiteSettings } from '@/lib/data'
import { resolveSeoTitle, resolveSeoDescription, resolveOgImages, getBaseUrl } from '@/lib/seo'
import { renderDescription } from '@/lib/renderDescription'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [category, settings] = await Promise.all([getBuildCategoryBySlug(slug), getSiteSettings()])
  if (!category) return {}

  const title       = resolveSeoTitle(category.seo_title, category.name, settings)
  const description = resolveSeoDescription(category.seo_description, category.description, settings)
  // OG fallback: og_image_url → image_url → global default
  const images      = resolveOgImages(category.og_image_url, category.image_url, settings)
  const canonical   = `${getBaseUrl()}/builds/${slug}`

  return {
    title, description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function BuildCategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getBuildCategoryBySlug(slug)
  if (!category) notFound()

  const photos = await getPhotosForBuildCategory(category.id)

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Hero — renders with or without image */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: category.image_url ? 320 : 180,
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        {category.image_url && (
          <>
            <Image src={category.image_url} alt={category.name} fill style={{ objectFit: 'cover', opacity: 0.45 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)' }} />
          </>
        )}
        <div style={{ position: 'relative', padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: 15, color: '#888', margin: 0, maxWidth: 600 }}>{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
        {/* Editorial description */}
        {category.page_description && (
          <div style={{ maxWidth: 720, marginTop: 32, marginBottom: 40 }}>
            {renderDescription(category.page_description, 'text-[#888] leading-relaxed')}
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div style={{
            columns: '3 280px',
            columnGap: 12,
            marginTop: category.page_description ? 0 : 40,
          }}>
            {photos.map((photo: any) => (
              <div key={photo.id} style={{ breakInside: 'avoid', marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumb_url || photo.url}
                  alt={photo.alt_text || `${category.name} — photo`}
                  style={{ width: '100%', display: 'block', borderRadius: 3 }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <p style={{ color: '#444', fontSize: 14, marginTop: 40 }}>No photos in this category yet.</p>
        )}
      </div>
    </main>
  )
}
