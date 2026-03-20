'use client'
import Image from 'next/image'
import type { Model, GalleryPhoto, Build, Accessory, Video, RacingGame, ModelBlock } from '@/lib/types'
import { renderDescription } from '@/lib/renderDescription'

type Props = {
  model: Model
  photos: GalleryPhoto[]
  builds: Build[]
  accessories: Accessory[]
  videos: Video[]
  games: RacingGame[]
  blocks: ModelBlock[]
}

// Render order: gallery → description → builds/accessories/videos/games
const DEFAULT_BLOCK_ORDER = ['gallery', 'builds', 'accessories', 'videos', 'racing_games']

export default function CarPageClient({ model, photos, builds, accessories, videos, games, blocks }: Props) {
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
              <ModelGallery photos={photos} />
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
        {/* Canonical render order: gallery → description → other blocks */}
        {renderBlock('gallery', 'gallery-0')}

        {/* Description immediately after gallery, before all other blocks */}
        {model.description && (
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
      </div>
    </main>
  )
}


// ── ModelGallery ────────────────────────────────────────────────────────────
// Dedicated model-page gallery. Strict CSS Grid, deterministic span rules.
// No masonry, no JS state, no relayout on interaction.
//
// Span rules (pre-computed from photo sequence):
//   vertical (any)      → span 1, auto-placed left-to-right, normal size
//   horizontal + V next → span 2 (.mgallery-h), V fills remaining column
//   lone horizontal     → full row (.mgallery-lone-h), img at 66% width centered
//
// Image rendering: width:100% height:auto — natural proportions, no objectFit,
// no fixed aspect-ratio container → zero black framing, zero cropping.
// Hover is pure CSS brightness — grid never changes.
function ModelGallery({ photos }: { photos: GalleryPhoto[] }) {
  type Span = 'single' | 'wide' | 'lone-h'
  const spans: Span[] = []
  let col = 0

  for (let i = 0; i < photos.length; i++) {
    const isH = photos[i].orientation !== 'vertical'
    const isLast = i === photos.length - 1

    if (isH) {
      // Horizontal needs 2 cols. If only 1 col remains, bump to next row.
      if (col === 2) col = 0

      if (col === 0) {
        // Col 2 will be empty unless the next photo is a vertical that fills it.
        const nextIsVertical = !isLast && photos[i + 1]?.orientation === 'vertical'
        if (nextIsVertical) {
          spans.push('wide')   // span 2, vertical fills col 2
          col = 2
        } else {
          spans.push('lone-h') // full row, nothing fills col 2
          col = 0
        }
      } else {
        // H at col=1 fills cols 1-2, completing the row.
        spans.push('wide')
        col = 0
      }
    } else {
      // Vertical: always span 1, auto-placed. Lone leftovers are NOT special —
      // they stay normal size at the leftmost available position.
      spans.push('single')
      col = (col + 1) % 3
    }
  }

  return (
    <div
      className="mgallery-grid"
      onContextMenu={e => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {photos.map((photo, i) => {
        const span  = spans[i]
        const src   = photo.thumb_url || photo.url

        return (
          <div
            key={photo.id}
            className={
              span === 'wide'   ? 'mgallery-item mgallery-h' :
              span === 'lone-h' ? 'mgallery-item mgallery-lone-h' :
              'mgallery-item'
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={photo.alt_text || photo.caption || ''}
              loading="lazy"
              draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 3, pointerEvents: 'none' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )
      })}
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
