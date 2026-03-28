import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPartCategoryBySlug, getPartsForCategory, getSiteSettings } from '@/lib/data'
import { resolveSeoTitle, resolveSeoDescription, resolveOgImages, getBaseUrl } from '@/lib/seo'
import { renderDescription } from '@/lib/renderDescription'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [category, settings] = await Promise.all([getPartCategoryBySlug(slug), getSiteSettings()])
  if (!category) return {}

  const title       = resolveSeoTitle(category.seo_title, category.name, settings)
  const description = resolveSeoDescription(category.seo_description, category.description, settings)
  const images      = resolveOgImages(category.og_image_url, category.image_url, settings)
  const canonical   = `${getBaseUrl()}/parts/${slug}`

  return {
    title, description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

const AVAIL_COLOR: Record<string, string> = {
  in_stock: '#39FF14',
  limited: '#f59e0b',
  discontinued: '#666',
}
const AVAIL_LABEL: Record<string, string> = {
  in_stock: 'In Stock',
  limited: 'Limited',
  discontinued: 'Discontinued',
}

export default async function PartCategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getPartCategoryBySlug(slug)
  if (!category) notFound()

  const parts = await getPartsForCategory(category.id)

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: category.image_url ? 200 : 140,
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        {category.image_url && (
          <>
            <Image src={category.image_url} alt={category.name} fill style={{ objectFit: 'cover', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)' }} />
          </>
        )}
        <div style={{ position: 'relative', padding: '28px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
        {category.page_description && (
          <div style={{ maxWidth: 680, marginTop: 28, marginBottom: 36 }}>
            {renderDescription(category.page_description, 'text-[#888] leading-relaxed')}
          </div>
        )}

        {parts.length === 0 && (
          <p style={{ color: '#444', fontSize: 14, marginTop: 36 }}>No parts listed in this category yet.</p>
        )}

        {/* Product cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: category.page_description ? 0 : 36 }}>
          {parts.map((part: any) => (
            <div key={part.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 4, overflow: 'hidden' }}>
              {/* Product image */}
              {part.image_url ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '60%', background: '#0a0a0a' }}>
                  <Image src={part.image_url} alt={`${part.brand_name ? part.brand_name + ' ' : ''}${part.name}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', paddingTop: '30%', background: '#0d0d0d' }} />
              )}

              <div style={{ padding: '14px 16px' }}>
                {/* Brand + name */}
                {part.brand_name && (
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#39FF14', textTransform: 'uppercase', margin: '0 0 3px' }}>
                    {part.brand_name}
                  </p>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{part.name}</p>

                {/* Key specs */}
                {part.key_specs && part.key_specs.length > 0 && (
                  <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', marginBottom: 10 }}>
                    {part.key_specs.map((spec: any, i: number) => (
                      <div key={i}>
                        <dt style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{spec.label}</dt>
                        <dd style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {/* Notes */}
                {part.notes && (
                  <p style={{ fontSize: 11, color: '#666', marginBottom: 10, lineHeight: 1.5 }}>{part.notes}</p>
                )}

                {/* Price + availability */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: part.affiliate_url ? 12 : 0 }}>
                  {part.price_range && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{part.price_range}</span>
                  )}
                  {part.availability && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: AVAIL_COLOR[part.availability] || '#666', letterSpacing: '0.08em' }}>
                      {AVAIL_LABEL[part.availability] || part.availability}
                    </span>
                  )}
                </div>

                {/* CTA */}
                {part.affiliate_url && (
                  <a href={part.affiliate_url} target="_blank" rel="noopener noreferrer nofollow"
                    style={{
                      display: 'block', textAlign: 'center', background: '#39FF14', color: '#000',
                      fontWeight: 700, fontSize: 12, padding: '9px 0', borderRadius: 3,
                      textDecoration: 'none', letterSpacing: '0.06em',
                    }}>
                    View / Buy →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
