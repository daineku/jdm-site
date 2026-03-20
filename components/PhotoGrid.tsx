'use client'
/**
 * PhotoGrid — reusable 3-column masonry photo renderer.
 * Always 3 columns. Cards scale by percentage width.
 * Uses masonry-layout + imagesloaded for true shortest-column packing.
 *
 * Contract: no data fetching, no page-specific logic.
 * Caller controls click-through via getHref.
 *
 * Aspect ratios:  vertical → 2/3   horizontal → 4/3
 * Caption: always visible, falls back to car title if no caption set.
 * Auto-highlight: one card cycles slowly; manual hover overrides.
 *
 * Performance: each card is React.memo'd — only the 2 cards whose isActive
 * changes will re-render per setActiveId tick. Image never gets new props.
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type PhotoGridItem = {
  id: string
  url: string
  thumb_url: string | null
  orientation: 'vertical' | 'horizontal'
  caption: string | null
  alt_text: string | null
  [key: string]: any
}

export interface PhotoGridProps {
  photos: PhotoGridItem[]
  gap?: number
  getHref?: (photo: PhotoGridItem) => string | null | undefined
  fit?: 'cover' | 'contain'
}

const VERTICAL_RATIO   = '2 / 3'
const HORIZONTAL_RATIO = '4 / 3'
const AUTO_INTERVAL_MS = 3500
const AUTO_RESUME_MS   = 8000

// Stable no-op for onError — defined once, never recreated
const noop = () => {}

// Stable style objects — same reference every render, prevents Next.js Image re-evaluation
const COVER_STYLE:   React.CSSProperties = { objectFit: 'cover' }
const CONTAIN_STYLE: React.CSSProperties = { objectFit: 'contain' }

// ── Memoized card — only re-renders when isActive changes for THIS card ──
const PhotoCard = memo(function PhotoCard({
  photo,
  isActive,
  href,
  cardWidth,
  gap,
  fit,
  onMouseEnter,
  onMouseLeave,
}: {
  photo: PhotoGridItem
  isActive: boolean
  href: string | null | undefined
  cardWidth: string
  gap: number
  fit: 'cover' | 'contain'
  onMouseEnter: (id: string) => void
  onMouseLeave: () => void
}) {
  const isVertical = photo.orientation === 'vertical'
  const src        = photo.thumb_url || photo.url
  // Fallback chain: explicit caption → car title → nothing
  const caption    = photo.caption || (photo as any).car?.title || null
  const altText    = photo.alt_text || caption || ''

  const cardStyle: React.CSSProperties = {
    width: cardWidth, marginBottom: gap,
    borderRadius: 3, overflow: 'hidden',
    display: 'block', background: '#111',
    // Prevent a:hover opacity from affecting card
    opacity: 1,
  }

  const inner = (
    <div
      className={isVertical ? 'pgrid-inner pgrid-inner--v' : 'pgrid-inner pgrid-inner--h'}
      style={{ position: 'relative', width: '100%', background: '#111', overflow: 'hidden' }}
    >
      {/* Scale wrapper — transform applied here so Image props stay stable.
          PhotoCard re-renders on isActive change; Image sees identical props → no re-request. */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: isActive ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.5s ease',
        willChange: 'transform',
      }}>
        <Image
          src={src}
          alt={altText}
          fill
          style={fit === 'cover' ? COVER_STYLE : CONTAIN_STYLE}
          sizes="33vw"
          onError={noop}
        />
      </div>

      {/* Base bottom gradient — always visible, subtle */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 35%, transparent 60%)',
      }} />

      {/* Active overlay — top+bottom dual gradient, fades in on active */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.26) 100%)',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} />

      {/* Caption — opacity transition, never unmounts to keep Image tree stable */}
      {caption && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          padding: '0 9px 8px',
          pointerEvents: 'none',
          maxWidth: '100%',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(3px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          <p style={{
            margin: 0,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
            textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}>
            {caption}
          </p>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        prefetch={false}
        className="pgrid-card"
        style={cardStyle}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') onMouseEnter(photo.id) }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') onMouseLeave() }}
      >
        {inner}
      </Link>
    )
  }
  return (
    <div
      className="pgrid-card"
      style={cardStyle}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') onMouseEnter(photo.id) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') onMouseLeave() }}
    >
      {inner}
    </div>
  )
})

export default function PhotoGrid({ photos, gap = 8, getHref, fit = 'cover' }: PhotoGridProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const masonryRef    = useRef<any>(null)
  const resizeTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const photosRef      = useRef<PhotoGridItem[]>(photos)
  photosRef.current    = photos
  const autoTimer      = useRef<ReturnType<typeof setInterval> | null>(null)
  const resumeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoIndexRef   = useRef(0)
  const manualActive   = useRef(false)
  const autoStartedRef = useRef(false)

  const startAuto = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current)
    autoTimer.current = setInterval(() => {
      if (manualActive.current) return
      const ps = photosRef.current
      if (ps.length === 0) return
      autoIndexRef.current = (autoIndexRef.current + 1) % ps.length
      setActiveId(ps[autoIndexRef.current]?.id ?? null)
    }, AUTO_INTERVAL_MS)
  }, [])

  const stopAuto = useCallback(() => {
    if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null }
  }, [])

  useEffect(() => {
    if (photos.length === 0 || autoStartedRef.current) return
    autoStartedRef.current = true
    const t = setTimeout(startAuto, 1200)
    return () => clearTimeout(t)
  }, [photos.length, startAuto])

  useEffect(() => {
    return () => {
      stopAuto()
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
    }
  }, [stopAuto])

  const handleMouseEnter = useCallback((id: string) => {
    manualActive.current = true
    stopAuto()
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    setActiveId(id)
  }, [stopAuto])

  const handleMouseLeave = useCallback(() => {
    manualActive.current = false
    setActiveId(null)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(startAuto, AUTO_RESUME_MS)
  }, [startAuto])

  const gutterShare = Math.ceil((gap * 2) / 3)
  const cardWidth   = `calc(33.333% - ${gutterShare}px)`

  // Init masonry ONCE on mount
  useEffect(() => {
    let cancelled = false
    const initOnce = async () => {
      if (!containerRef.current || masonryRef.current) return
      const [{ default: Masonry }] = await Promise.all([
        import('masonry-layout'),
      ])
      if (cancelled || !containerRef.current || masonryRef.current) return
      const msnry = new Masonry(containerRef.current, {
        itemSelector: '.pgrid-card',
        columnWidth: '.pgrid-sizer',
        percentPosition: true,
        gutter: gap,
        // transitionDuration:0 → masonry skips the from→to animation path entirely.
        // New cards are invisible (default hiddenStyle opacity:0) while masonry places
        // them at top:0,left:0, then layoutItems sets correct coordinates, then they
        // appear instantly. Prevents the black flash caused by unpositioned cards
        // briefly covering the first card in the grid.
        transitionDuration: 0,
      })
      masonryRef.current = msnry
      // Cards have CSS aspect-ratio (.pgrid-inner--v/h) so masonry knows heights
      // without waiting for images to load. Calling layout() directly avoids
      // imagesLoaded(container) which probes ALL lazy imgs via proxyImage,
      // causing a forced early HTTP request for below-viewport images that
      // then fire again when native lazy loading triggers → duplicate requests.
      masonryRef.current.layout()
    }
    initOnce()
    return () => {
      cancelled = true
      masonryRef.current?.destroy()
      masonryRef.current = null
    }
  }, [gap])

  // On append: tell masonry about new elements only
  const prevCountRef = useRef(0)
  useEffect(() => {
    const currentCount = photos.length
    const prevCount    = prevCountRef.current
    prevCountRef.current = currentCount
    if (!masonryRef.current || currentCount <= prevCount) return
    const allCards = containerRef.current?.querySelectorAll('.pgrid-card')
    if (!allCards) return
    const newCards = Array.from(allCards).slice(prevCount)
    if (newCards.length === 0) return
    // appended() positions only new items; existing items are untouched.
    // No layout() call here — it would reposition ALL items, causing existing
    // cards to visually jump (the "duplicate" appearance).
    // Cards have explicit aspectRatio CSS so masonry knows heights immediately.
    masonryRef.current.appended(newCards)
  }, [photos.length])

  // Debounced resize re-layout
  useEffect(() => {
    const onResize = () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current)
      resizeTimer.current = setTimeout(() => { masonryRef.current?.layout() }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (resizeTimer.current) clearTimeout(resizeTimer.current)
    }
  }, [])

  if (photos.length === 0) return null

  return (
    <div style={{ padding: `0 ${gap}px` }}>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div
          className="pgrid-sizer"
          style={{ width: cardWidth, height: 0, margin: 0, padding: 0 }}
          aria-hidden="true"
        />
        {photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isActive={activeId === photo.id}
            href={getHref ? getHref(photo) : null}
            cardWidth={cardWidth}
            gap={gap}
            fit={fit}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
    </div>
  )
}
