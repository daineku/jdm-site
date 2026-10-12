import Image, { getImageProps, type StaticImageData } from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import divider from '@/public/images/brand/divider-line.png'

/**
 * Art-directed cover: a desktop master and an optional phone crop, each served through the
 * image optimizer at the width the frame really renders, so no candidate is ever enlarged on
 * screen. The frame's CSS aspect-ratio must match the master used at that breakpoint (see
 * .st-project__frame), which keeps object-fit: cover from cropping or scaling anything.
 *
 * Built on next/image's getImageProps + <picture>, the documented way to switch sources by
 * media query; below `breakpoint` the browser takes the mobile source.
 */
export function ArtDirectedCover({
  desktop,
  mobile,
  alt,
  sizes,
  mobileSizes = '100vw',
  quality = 85,
  breakpoint = 899,
  position = '50% 50%',
  mobilePosition = position,
  priority = false,
  className = '',
  children,
}: {
  desktop: StaticImageData
  mobile?: StaticImageData
  alt: string
  /** Rendered width of the frame on desktop, e.g. "(max-width: 899px) 100vw, min(90vw, 1296px)". */
  sizes: string
  mobileSizes?: string
  quality?: number
  breakpoint?: number
  position?: string
  mobilePosition?: string
  priority?: boolean
  className?: string
  children?: ReactNode
}) {
  const style = { '--st-pos': position, '--st-pos-m': mobilePosition } as CSSProperties
  const { props: img } = getImageProps({ src: desktop, alt, sizes, quality, priority })
  const mob = mobile ? getImageProps({ src: mobile, alt, sizes: mobileSizes, quality, priority }).props : null
  return (
    <div className={`st-crop ${className}`} style={style}>
      <div className="st-crop__zoom">
        <picture>
          {mob && <source media={`(max-width: ${breakpoint}px)`} srcSet={mob.srcSet} sizes={mob.sizes} />}
          {/* srcSet, sizes, loading and decoding come from getImageProps; alt restated so the a11y lint can see it */}
          <img {...img} alt={alt} className="st-cover__img" draggable={false}
            style={{ ...img.style, position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </picture>
      </div>
      {children}
    </div>
  )
}

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

/**
 * A whole image covering its frame, framed by object-position alone (the source is never
 * re-cut). Used for project artwork whose owner has fixed its composition. Desktop and
 * mobile framing are separate because the frame changes width, not just size, below 900px.
 */
export function Cover({
  src,
  alt,
  position,
  mobilePosition = position,
  sizes,
  className = '',
  children,
}: {
  src: StaticImageData
  alt: string
  position: string
  mobilePosition?: string
  sizes: string
  className?: string
  children?: ReactNode
}) {
  const style = { '--st-pos': position, '--st-pos-m': mobilePosition } as CSSProperties
  return (
    <div className={`st-crop ${className}`} style={style}>
      <div className="st-crop__zoom">
        <Image src={src} alt={alt} fill sizes={sizes} className="st-cover__img" draggable={false} />
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
