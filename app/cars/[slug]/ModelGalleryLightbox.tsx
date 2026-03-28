'use client'
import { useEffect, useRef, useState } from 'react'
import type { GalleryPhoto } from '@/lib/types'

type Props = {
  photos: GalleryPhoto[]
  modelTitle: string
  selectedIndex: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

const ARROW_HIDE_DELAY = 2200

export function ModelGalleryLightbox({ photos, modelTitle, selectedIndex, onClose, onPrev, onNext }: Props) {
  const [arrowsVisible, setArrowsVisible] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerActivity = () => {
    setArrowsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setArrowsVisible(false), ARROW_HIDE_DELAY)
  }

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIndex, onClose, onPrev, onNext])

  // Body scroll lock
  useEffect(() => {
    if (selectedIndex !== null) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [selectedIndex])

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }, [])

  if (selectedIndex === null) return null
  const photo = photos[selectedIndex]
  if (!photo) return null

  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < photos.length - 1
  const caption = photo.caption?.trim() || null

  // Shared activity visibility for arrows AND close button
  const controlOpacity = arrowsVisible ? 1 : 0
  const controlEvents: React.CSSProperties['pointerEvents'] = arrowsVisible ? 'auto' : 'none'

  // ── Navigation arrow: narrow fixed-width hit target, full container height ──
  // Width ~100px — large enough to tap comfortably, NOT a half-image zone.
  // Glyph is centered inside the zone; zone itself is transparent.
  const NavArrow = ({
    side, active, onActivate,
  }: { side: 'left' | 'right'; active: boolean; onActivate: () => void }) => (
    <div
      onClick={e => { e.stopPropagation(); if (active) onActivate() }}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      role="button"
      tabIndex={active ? 0 : -1}
      onKeyDown={e => { if (active && (e.key === 'Enter' || e.key === ' ')) onActivate() }}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 100,          // fixed narrow zone — NOT 50% of image
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: active ? 'pointer' : 'default',
        background: 'none',
        zIndex: 2,
        opacity: controlOpacity,
        transition: 'opacity 0.25s ease',
        pointerEvents: active ? controlEvents : 'none',
      }}
    >
      {active && (
        <span style={{
          fontSize: 42,
          color: 'rgba(255,255,255,0.72)',
          fontFamily: 'Manrope, sans-serif',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          {side === 'left' ? '‹' : '›'}
        </span>
      )}
    </div>
  )

  return (
    <div
      onClick={onClose}
      onMouseMove={triggerActivity}
      onTouchStart={triggerActivity}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close — same activity visibility as arrows */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top, 16px))',
          right: 16,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: '8px 13px',
          zIndex: 5,
          fontFamily: 'Manrope, sans-serif',
          opacity: controlOpacity,
          transition: 'opacity 0.25s ease',
          pointerEvents: controlEvents,
        }}
      >×</button>

      {/* Counter */}
      <p style={{
        position: 'absolute',
        top: 'max(20px, env(safe-area-inset-top, 20px))',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.1em',
        margin: 0,
        zIndex: 5,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        {selectedIndex + 1} / {photos.length}
      </p>

      {/* Stable image frame — fixed viewport dimensions so zones never reflow.
          Removing key={photo.id} means React reuses the same <img> DOM node and
          just updates src. The browser keeps the previous image painted until
          the new src finishes loading — no black flash, no control jump. */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '98vw',
          height: '96vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Narrow left arrow zone — ~100px wide */}
        <NavArrow side="left" active={hasPrev} onActivate={onPrev} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // No key — same DOM node, src update only. Keeps old image visible during load.
          src={photo.url}
          alt={photo.alt_text?.trim() || photo.caption?.trim() || `${modelTitle} — photo`}
          draggable={false}
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 3,
            // Image sits below nav zones in z-order so zones capture clicks
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Narrow right arrow zone — ~100px wide */}
        <NavArrow side="right" active={hasNext} onActivate={onNext} />
      </div>

      {/* Caption */}
      {caption && (
        <p
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: 16,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            maxWidth: '70vw',
            lineHeight: 1.6,
            pointerEvents: 'none',
          }}
        >
          {caption}
        </p>
      )}
    </div>
  )
}
