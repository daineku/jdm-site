import Image, { type StaticImageData } from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import divider from '@/public/images/brand/divider-line.png'

/**
 * Shows an exact source-pixel region of an image inside a frame.
 * The frame's CSS aspect-ratio must equal region.w / region.h; the crop is then
 * identical at every size, so overlay positions (annotations) stay locked to the
 * picture. `frameVw`/`frameMaxPx` describe the frame's rendered width so the
 * browser can pick a suitable source from the optimizer.
 */
export function Crop({
  src,
  alt,
  region,
  className = '',
  frameVw,
  frameMaxPx,
  children,
}: {
  src: StaticImageData
  alt: string
  region: { x: number; y: number; w: number; h: number }
  className?: string
  frameVw: number
  frameMaxPx: number
  children?: ReactNode
}) {
  const scale = src.width / region.w
  const imgStyle: CSSProperties = {
    width: `${scale * 100}%`,
    left: `${(-region.x / region.w) * 100}%`,
    top: `${(-region.y / region.h) * 100}%`,
  }
  const sizes = `(max-width: 899px) ${Math.round(100 * scale)}vw, min(${Math.round(frameVw * scale)}vw, ${Math.round(frameMaxPx * scale)}px)`

  return (
    <div className={`st-crop ${className}`}>
      <div className="st-crop__zoom">
        <Image
          src={src}
          alt={alt}
          sizes={sizes}
          className="st-crop__img"
          style={imgStyle}
          draggable={false}
        />
      </div>
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  lead,
  label,
  align = 'center',
  id,
  className = '',
}: {
  title: string
  lead?: string
  label?: string
  align?: 'center' | 'left'
  id?: string
  className?: string
}) {
  return (
    <div className={`st-heading ${align === 'center' ? 'st-heading--center' : ''} ${className}`} data-reveal="">
      {label && <p className="st-label st-label--rule" style={{ margin: 0 }}>{label}</p>}
      <h2 id={id} className="st-h2 st-heading__title">{title}</h2>
      {lead && <p className="st-lead">{lead}</p>}
    </div>
  )
}

/** The brand divider artwork. Decorative — hidden from assistive tech. */
export function SectionDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`st-divider ${className}`} aria-hidden="true">
      <Image src={divider} alt="" sizes="(max-width: 599px) 160vw, 1040px" />
    </div>
  )
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span className={`st-btn__arrow ${diagonal ? 'st-btn__arrow--diag' : ''}`} aria-hidden="true">
      {diagonal ? '↗' : '→'}
    </span>
  )
}

/** Stagger for `[data-reveal]` children. */
export function delay(ms: number): CSSProperties {
  return { '--st-delay': `${ms}ms` } as CSSProperties
}
