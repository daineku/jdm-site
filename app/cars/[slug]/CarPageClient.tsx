'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Model, GalleryPhoto, Build, Accessory, Video, RacingGame, ModelBlock, CarFitment, CarWheelSpecs, BuildCategory, AftermarketPart } from '@/lib/types'
import { renderDescription } from '@/lib/renderDescription'
import { ModelGalleryLightbox } from './ModelGalleryLightbox'

type ModelCategory = Pick<BuildCategory, 'id' | 'name' | 'slug' | 'description' | 'icon_ref' | 'sort_order'>

type Props = {
  model: Model
  photos: GalleryPhoto[]
  builds: Build[]
  accessories: Accessory[]
  videos: Video[]
  games: RacingGame[]
  blocks: ModelBlock[]
  fitment: CarFitment | null
  wheelSpecs: CarWheelSpecs | null
  categories: ModelCategory[]
  parts: (AftermarketPart & { category?: { id: string; name: string; slug: string; icon_ref: string | null } | null })[]
  buildInstances: { id: string; title: string; setup_summary: string; category?: { name: string; slug: string } | null; photos?: { photo_id: string; sort_order: number; photo?: { url: string; thumb_url: string | null } | null }[] }[]
}

// Render order: gallery → description → builds/accessories/videos/games
const DEFAULT_BLOCK_ORDER = ['gallery', 'builds', 'accessories', 'videos', 'racing_games']

export default function CarPageClient({ model, photos, builds, accessories, videos, games, blocks, fitment, wheelSpecs, categories, parts, buildInstances }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Copyright deterrence — fired once on mount, not on every re-render
  useEffect(() => {
    console.warn(
      "Copyright Notice: These images are protected by copyright and are provided for viewing only. Unauthorized copying, downloading, reproduction, distribution, or commercial use without prior written permission is prohibited and may result in legal action."
    )
  }, [])

  const activeBlocks: string[] = []
  const seen = new Set<string>()
  const source = blocks.length > 0 ? blocks.map(b => b.block_type) : DEFAULT_BLOCK_ORDER
  for (const t of source) {
    if (!seen.has(t)) { seen.add(t); activeBlocks.push(t) }
  }

  const renderBlock = (blockType: string, key: string) => {
    try {
      switch (blockType) {

        case 'gallery':
          if (photos.length === 0) return null
          return (
            <Section key={key} id="gallery">
              <h2 style={{
                margin: '0 0 20px',
                color: '#fff',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}>
                {model.title}
              </h2>
              <ModelGallery
                photos={photos}
                modelTitle={model.title}
                description={model.description}
                onPhotoClick={setLightboxIndex}
              />
            </Section>
          )

        case 'builds':
          if (builds.length === 0) return null
          return (
            <Section key={key} id="builds">
              <SectionLabel>Builds</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {builds.map(build => (
                  <div key={build.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 3 }} className="p-5">
                    <h3 className="font-bold text-white text-lg mb-2">{build.title}</h3>
                    {build.description && <p className="text-[#777] text-sm mb-4 leading-relaxed">{build.description}</p>}
                    {build.build_parts && build.build_parts.length > 0 ? (
                      <ul className="space-y-1">
                        {[...build.build_parts].sort((a: any, b: any) => a.sort_order - b.sort_order).map((part: any) => (
                          <li key={part.id} className="text-xs flex items-start gap-2" style={{ color: '#555' }}>
                            <span style={{ color: '#39FF14', marginTop: 1 }}>›</span>
                            <span>{part.name}{part.notes && <span style={{ color: '#444' }}> — {part.notes}</span>}</span>
                          </li>
                        ))}
                      </ul>
                    ) : build.parts && build.parts.length > 0 ? (
                      <ul className="space-y-1">
                        {build.parts.map((part: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#555' }}>
                            <span style={{ color: '#39FF14', marginTop: 1 }}>›</span>
                            <span>{part}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          )

        case 'accessories':
          if (accessories.length === 0) return null
          return (
            <Section key={key} id="accessories">
              <SectionLabel>Accessories</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessories.map((acc: Accessory) => (
                  <a key={acc.id} href={acc.buy_url || '#'} target="_blank" rel="noopener noreferrer"
                    className="card-hover flex gap-3 p-4"
                    style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 3 }}>
                    {acc.image_url && (
                      <div className="w-16 h-16 relative flex-shrink-0">
                        <Image src={acc.image_url} alt={acc.title} fill className="object-cover rounded" onError={() => {}} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium mb-1 truncate">{acc.title}</p>
                      {acc.description && <p className="text-[#666] text-xs leading-relaxed line-clamp-2">{acc.description}</p>}
                      <span className="inline-block mt-2 text-xs font-semibold tracking-widest uppercase" style={{ color: '#39FF14' }}>
                        {acc.store} ›
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Section>
          )

        case 'videos':
          if (videos.length === 0) return null
          return (
            <Section key={key} id="videos">
              <SectionLabel>Videos</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video: Video) => {
                  const embedId = video.embed_id || getTikTokId(video.tiktok_url)
                  return (
                    <div key={video.id} className="card-hover overflow-hidden"
                      style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 3 }}>
                      {embedId ? (
                        <div className="relative aspect-[9/16] bg-[#0a0a0a]">
                          <iframe src={`https://www.tiktok.com/embed/${embedId}`}
                            className="absolute inset-0 w-full h-full" allowFullScreen />
                        </div>
                      ) : (
                        <div className="aspect-[9/16] bg-[#111] flex items-center justify-center">
                          <a href={video.tiktok_url || '#'} target="_blank" rel="noopener noreferrer"
                            className="text-xs" style={{ color: '#39FF14' }}>Watch on TikTok ›</a>
                        </div>
                      )}
                      {video.title && <p className="px-4 py-3 text-sm text-[#888]">{video.title}</p>}
                    </div>
                  )
                })}
              </div>
            </Section>
          )

        case 'racing_games':
          if (games.length === 0) return null
          return (
            <Section key={key} id="racing-games">
              <SectionLabel>Racing Games</SectionLabel>
              <div className="flex flex-wrap gap-4">
                {games.map((game: RacingGame) => (
                  <a key={game.id}
                    href={game.external_url || '#'}
                    target={game.external_url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="card-hover flex items-center gap-4 px-5 py-4"
                    style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 3 }}>
                    {game.game_logo_url && (
                      <div className="w-10 h-10 relative flex-shrink-0">
                        <Image src={game.game_logo_url} alt={game.game_title} fill className="object-contain" onError={() => {}} />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-semibold">{game.game_title}</p>
                      {game.description && <p className="text-[#666] text-xs mt-0.5">{game.description}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </Section>
          )

        default:
          return null
      }
    } catch {
      return null
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Lightbox — isolated component, caption shown only when photo.caption is set */}
      <ModelGalleryLightbox
        photos={photos}
        modelTitle={model.title}
        selectedIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex(i => i !== null && i > 0 ? i - 1 : i)}
        onNext={() => setLightboxIndex(i => i !== null && i < photos.length - 1 ? i + 1 : i)}
      />

      {/* Hero — only renders when cover_image is explicitly set on this model.
          First gallery photo is the OG/metadata fallback only (see page.tsx).
          Models without cover_image have no hero — page goes straight to gallery. */}
      {model.cover_image && (
        <div className="relative w-full" style={{ height: '55vh', minHeight: 320 }}>
          <Image src={model.cover_image} alt={model.title} fill className="object-cover" priority onError={() => {}} />
          <div style={{ background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)', position: 'absolute', inset: 0 }} />
          <div className="absolute bottom-8 left-6 sm:left-10">
            {(model.brand_data?.name || model.brand) && (
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                {model.brand_data?.name || model.brand}
              </p>
            )}
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{model.title}</h1>
            {model.subtitle && <p className="mt-2 text-sm text-[#888]">{model.subtitle}</p>}
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
        {/*
          CANONICAL PUBLIC RENDER ORDER — DO NOT REORDER
          1. gallery           (renderBlock, always first)
          2. description       (model.description, explicit — not via blocks)
          3. builds            (renderBlock, via activeBlocks)
          4. accessories       (renderBlock, via activeBlocks)
          5. videos            (renderBlock, via activeBlocks)
          6. racing_games      (renderBlock, via activeBlocks)
          7. style / categories (explicit — categories.length > 0)
          8. specs / wheelSpecs (explicit — wheelSpecs && has any data)
          9. fitment            (explicit — fitment && has data && is_visible)
         10. mods / parts       (explicit — parts.length > 0)
        */}
        {renderBlock('gallery', 'gallery-0')}

        {/* Description: rendered inside ModelGallery flow when photos exist.
             Only rendered here as fallback when there are no photos at all. */}
        {model.description && photos.length === 0 && (
          <Section id="overview">
            <div className="text-[#888] leading-relaxed max-w-2xl" style={{ fontSize: 15 }}>
              {renderDescription(model.description, 'text-[#888] leading-relaxed')}
            </div>
          </Section>
        )}

        {/* Remaining blocks: builds, accessories, videos, racing_games */}
        {activeBlocks
          .filter(blockType => blockType !== 'gallery')
          .map((blockType, i) => renderBlock(blockType, `${blockType}-${i}`))}

        {/* Build categories — render if any assigned */}
        {categories.length > 0 && (
          <Section id="style">
            <SectionLabel>Build Style</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => (
                <span key={cat.id} style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '5px 12px',
                  border: '1px solid #2a2a2a', borderRadius: 2,
                  color: '#888', background: '#111',
                }}>
                  {cat.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* OEM vs Aftermarket wheel/tire/offset specs */}
        {wheelSpecs && (
          wheelSpecs.oem_wheel_size_front || wheelSpecs.oem_tire_front || wheelSpecs.oem_offset_front ||
          wheelSpecs.am_wheel_brand || wheelSpecs.am_wheel_size_front || wheelSpecs.am_tire_front
        ) && (() => {
          const G = '#39FF14'
          const LABEL: React.CSSProperties = { fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }
          const VAL: React.CSSProperties = { fontSize: 13, color: '#aaa', margin: 0 }
          const EMPTY_VAL = <span style={{ color: '#333' }}>—</span>
          const v = (val: string | null) => val ? <span style={VAL}>{val}</span> : EMPTY_VAL
          const rows: { label: string; oem: string | null; am: string | null }[] = [
            { label: 'Wheel — Front', oem: wheelSpecs.oem_wheel_size_front, am: wheelSpecs.am_wheel_size_front },
            { label: 'Wheel — Rear',  oem: wheelSpecs.oem_wheel_size_rear,  am: wheelSpecs.am_wheel_size_rear  },
            { label: 'Offset — Front', oem: wheelSpecs.oem_offset_front, am: wheelSpecs.am_offset_front },
            { label: 'Offset — Rear',  oem: wheelSpecs.oem_offset_rear,  am: wheelSpecs.am_offset_rear  },
            { label: 'Tire — Front',  oem: wheelSpecs.oem_tire_front,  am: wheelSpecs.am_tire_front  },
            { label: 'Tire — Rear',   oem: wheelSpecs.oem_tire_rear,   am: wheelSpecs.am_tire_rear   },
          ]
          const hasAm = wheelSpecs.am_wheel_brand || wheelSpecs.am_wheel_model || rows.some(r => r.am)
          return (
            <Section id="specs">
              <SectionLabel>Specs</SectionLabel>
              {/* Aftermarket wheel brand/model header — only if present */}
              {hasAm && (wheelSpecs.am_wheel_brand || wheelSpecs.am_wheel_model) && (
                <p style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>
                  Aftermarket: <span style={{ color: '#aaa' }}>
                    {[wheelSpecs.am_wheel_brand, wheelSpecs.am_wheel_model].filter(Boolean).join(' ')}
                  </span>
                </p>
              )}
              {/* Comparison table */}
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ ...LABEL, textAlign: 'left', paddingBottom: 10, paddingRight: 24, whiteSpace: 'nowrap' }}></th>
                      <th style={{ ...LABEL, textAlign: 'left', paddingBottom: 10, paddingRight: 24, color: G }}>OEM</th>
                      {hasAm && <th style={{ ...LABEL, textAlign: 'left', paddingBottom: 10, color: '#aaa' }}>Aftermarket</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.filter(r => r.oem || r.am).map(row => (
                      <tr key={row.label} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td style={{ ...LABEL, paddingTop: 10, paddingBottom: 10, paddingRight: 24, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.label}</td>
                        <td style={{ paddingTop: 10, paddingBottom: 10, paddingRight: 24, verticalAlign: 'top' }}>{v(row.oem)}</td>
                        {hasAm && <td style={{ paddingTop: 10, paddingBottom: 10, verticalAlign: 'top' }}>{v(row.am)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Notes */}
              {wheelSpecs.oem_notes && (
                <p style={{ fontSize: 12, color: '#555', marginTop: 12 }}>OEM: {wheelSpecs.oem_notes}</p>
              )}
              {wheelSpecs.am_notes && (
                <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>Aftermarket: {wheelSpecs.am_notes}</p>
              )}
            </Section>
          )
        })()}

        {/* Fitment */}
        {fitment && (fitment.fitment_style || fitment.ride_height || fitment.camber_look ||
          fitment.best_wheel_style || fitment.observed_rim_guess ||
          fitment.popular_rim_option_1 || fitment.editorial_summary) && (
          <Section id="fitment">
            <SectionLabel>Fitment</SectionLabel>

            {/* Stance descriptors */}
            {(fitment.fitment_style || fitment.ride_height || fitment.camber_look) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {[
                  { label: 'Style', value: fitment.fitment_style },
                  { label: 'Height', value: fitment.ride_height },
                  { label: 'Camber', value: fitment.camber_look },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 2, padding: '6px 12px' }}>
                    <p style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>{d.label}</p>
                    <p style={{ fontSize: 12, color: '#ccc', margin: 0, textTransform: 'capitalize' }}>{d.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Wheel guidance */}
            {(fitment.best_wheel_style || fitment.best_diameter || fitment.observed_rim_guess) && (
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 3, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 10, color: '#39FF14', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Wheel Guidance</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {fitment.best_wheel_style && (
                    <div><p style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }}>Best Style</p><p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{fitment.best_wheel_style}</p></div>
                  )}
                  {fitment.best_diameter && (
                    <div><p style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }}>Best Diameter</p><p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{fitment.best_diameter}</p></div>
                  )}
                  {fitment.observed_rim_guess && (
                    <div><p style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }}>On This Car</p><p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{fitment.observed_rim_guess}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Popular options */}
            {(fitment.popular_rim_option_1 || fitment.popular_rim_option_2) && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, color: '#39FF14', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Popular Options</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[fitment.popular_rim_option_1, fitment.popular_rim_option_2].filter(Boolean).map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#39FF14', fontSize: 10 }}>›</span>
                      <span style={{ fontSize: 13, color: '#888' }}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editorial summary */}
            {fitment.editorial_summary && (
              <div style={{ color: '#888', fontSize: 14, lineHeight: 1.7 }}>
                {renderDescription(fitment.editorial_summary, 'text-[#888]')}
              </div>
            )}
          </Section>
        )}

        {/* Aftermarket parts — grouped by category */}
        {parts.length > 0 && (
          <Section id="mods">
            <SectionLabel>Mods</SectionLabel>
            {(() => {
              const grouped: Map<string, { label: string; items: typeof parts }> = new Map()
              parts.forEach(p => {
                const key = p.category?.id ?? '__none'
                const label = p.category?.name ?? 'Other'
                if (!grouped.has(key)) grouped.set(key, { label, items: [] })
                grouped.get(key)!.items.push(p)
              })
              return Array.from(grouped.values()).map(group => (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, color: '#39FF14', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{group.label}</p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {group.items.map(p => (
                      <li key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                        <span style={{ color: '#39FF14', fontSize: 10, marginTop: 2, flexShrink: 0 }}>›</span>
                        <span style={{ fontSize: 13, color: '#888' }}>
                          {p.brand_name && <span style={{ color: '#aaa', fontWeight: 600 }}>{p.brand_name} </span>}
                          {p.name}
                          {p.notes && <span style={{ color: '#555', fontSize: 12 }}> — {p.notes}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            })()}
          </Section>
        )}

        {/* Slot 11 — Build Instances: per-model builds tagged with a Build Category */}
        {buildInstances.length > 0 && (
          <Section id="builds">
            <SectionLabel>Builds</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {buildInstances.map(build => {
                const sortedPhotos = (build.photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
                const featuredThumb = sortedPhotos[0]?.photo?.thumb_url || sortedPhotos[0]?.photo?.url || null
                return (
                  <div key={build.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#111', border: '1px solid #1e1e1e', borderRadius: 3, padding: '12px 16px', flex: '1 1 240px', maxWidth: 340 }}>
                    {featuredThumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featuredThumb} alt={build.title} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      {build.category && (
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#39FF14', textTransform: 'uppercase', margin: '0 0 2px' }}>
                          {build.category.name}
                        </p>
                      )}
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: '0 0 2px' }}>{build.title}</p>
                      <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.4 }}>{build.setup_summary}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

      </div>
    </main>
  )
}


// ── ModelGallery ────────────────────────────────────────────────────────────
// Row-aware gallery. Computes explicit visual rows so description can be
// injected between row 0 and remaining rows when the conditions are met.
//
// Row span rules (unchanged from original):
//   vertical (any)      → span 1, col advances 1
//   H + next is V       → span 2 (.mgallery-h), V fills remaining col → row ends
//   lone horizontal     → full row (.mgallery-lone-h)
//   H at col 1          → span 2, row ends
//   H at col 2 (no fit) → flush incomplete row, H starts next row

type RowItem = { photo: GalleryPhoto; globalIndex: number; span: 'single' | 'wide' | 'lone-h' }

function computeGalleryRows(photos: GalleryPhoto[]): RowItem[][] {
  const rows: RowItem[][] = []
  let cur: RowItem[] = []
  let col = 0

  const flush = () => { if (cur.length) { rows.push(cur); cur = [] } }

  for (let i = 0; i < photos.length; i++) {
    const isH = photos[i].orientation !== 'vertical'
    const isLast = i === photos.length - 1
    let span: 'single' | 'wide' | 'lone-h'

    if (isH) {
      if (col === 2) { flush(); col = 0 }   // H won't fit — flush incomplete row
      if (col === 0) {
        const nextIsV = !isLast && photos[i + 1]?.orientation === 'vertical'
        span = nextIsV ? 'wide' : 'lone-h'
        col  = nextIsV ? 2 : 0
      } else {
        span = 'wide'; col = 0
      }
    } else {
      span = 'single'; col = (col + 1) % 3
    }

    cur.push({ photo: photos[i], globalIndex: i, span })
    if (col === 0) flush()
  }
  flush()
  return rows
}

function ModelGallery({ photos, modelTitle, description, onPhotoClick }: {
  photos: GalleryPhoto[]
  modelTitle: string
  description?: string | null
  onPhotoClick: (index: number) => void
}) {
  const rows = computeGalleryRows(photos)
  // Inject description between row 0 and rest only when both conditions are true
  const injectDesc = !!description && rows.length > 1

  const renderRowItem = (item: RowItem) => (
    <div
      key={item.photo.id}
      className={
        item.span === 'wide'   ? 'mgallery-item mgallery-h' :
        item.span === 'lone-h' ? 'mgallery-item mgallery-lone-h' :
        'mgallery-item'
      }
      onClick={() => onPhotoClick(item.globalIndex)}
      style={{ cursor: 'pointer' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.photo.thumb_url || item.photo.url}
        alt={item.photo.alt_text?.trim() || item.photo.caption?.trim() || `${modelTitle} — photo`}
        loading="lazy"
        draggable={false}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 3, pointerEvents: 'none' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )

  const renderRow = (row: RowItem[], key: number) => {
    // Sparse vertical row (1 or 2 vertical photos only) → centered
    const allSingle = row.every(item => item.span === 'single')
    if (allSingle && row.length < 3) {
      return (
        <div key={key} className="mgallery-row mgallery-centered-row">
          {row.map(item => (
            <div
              key={item.photo.id}
              className="mgallery-centered-item"
              onClick={() => onPhotoClick(item.globalIndex)}
              style={{ cursor: 'pointer' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.photo.thumb_url || item.photo.url}
                alt={item.photo.alt_text?.trim() || item.photo.caption?.trim() || `${modelTitle} — photo`}
                loading="lazy"
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 3 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ))}
        </div>
      )
    }
    // Normal row — standard 3-col grid
    return (
      <div key={key} className="mgallery-row mgallery-grid">
        {row.map(renderRowItem)}
      </div>
    )
  }

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {/* Row 0 */}
      {rows.length > 0 && renderRow(rows[0], 0)}

      {/* Description injected as row 2 — inside gallery flow */}
      {injectDesc && (
        <div className="mgallery-desc-row">
          {renderDescription(description!, 'text-[#888] leading-relaxed')}
        </div>
      )}

      {/* Remaining rows (rows[1:]).
          If no injection, rows[1:] renders without description between them.
          If description exists but only 1 row, render description after. */}
      {rows.slice(1).map((row, i) => renderRow(row, i + 1))}

      {/* Description fallback: 1 photo row or no photos — render after gallery */}
      {description && !injectDesc && (
        <div className="mgallery-desc-row">
          {renderDescription(description, 'text-[#888] leading-relaxed')}
        </div>
      )}
    </div>
  )
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-10 border-t" style={{ borderColor: '#1a1a1a' }}>
      {children}
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#39FF14' }}>
      {children}
    </p>
  )
}

function getTikTokId(url: string): string {
  if (!url) return ''
  try {
    const match = url.match(/video\/(\d+)/)
    return match ? match[1] : ''
  } catch { return '' }
}
