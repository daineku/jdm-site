'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SpeedometerLoader from './SpeedometerLoader'
import type { GalleryPhoto } from '@/lib/types'

const INITIAL_BATCH = 12

export default function MasonryGallery({ brandFilter }: { brandFilter?: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [batchSize, setBatchSize] = useState(INITIAL_BATCH)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(Date.now())

  const buildQuery = useCallback((offset: number, limit: number) => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    })
    if (brandFilter) params.set('brand', brandFilter)
    return `/api/photos?${params}`
  }, [brandFilter])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadProgress(0)
      setPhotos([])
      setPage(0)
      setHasMore(true)
      startTimeRef.current = Date.now()

      const timer = setInterval(() => setLoadProgress(p => Math.min(p + 10, 85)), 100)
      try {
        const res = await fetch(buildQuery(0, INITIAL_BATCH))
        const json = await res.json()
        const data: GalleryPhoto[] = json.photos || []
        const elapsed = Date.now() - startTimeRef.current
        if (elapsed < 600) setBatchSize(24)
        else if (elapsed < 1500) setBatchSize(16)
        else setBatchSize(8)
        setLoadProgress(100)
        setTimeout(() => { setPhotos(data); setHasMore(data.length === INITIAL_BATCH); setLoading(false) }, 250)
      } catch {
        setLoading(false)
      } finally {
        clearInterval(timer)
      }
    }
    load()
  }, [brandFilter, buildQuery])

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return
      const nextPage = page + 1
      const offset = nextPage * batchSize
      try {
        const res = await fetch(buildQuery(offset, batchSize))
        const json = await res.json()
        const data: GalleryPhoto[] = json.photos || []
        if (data.length > 0) {
          setPhotos(prev => [...prev, ...data])
          setPage(nextPage)
          setHasMore(data.length === batchSize)
        } else {
          setHasMore(false)
        }
      } catch { setHasMore(false) }
    }, { threshold: 0.1 })
    const el = loaderRef.current
    observer.observe(el)
    return () => observer.disconnect()
  }, [loaderRef, hasMore, loading, page, batchSize, buildQuery])

  if (loading) return <SpeedometerLoader progress={loadProgress} />

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-xs tracking-widest uppercase" style={{ color: '#333' }}>No photos yet</p>
      </div>
    )
  }

  const cols: GalleryPhoto[][] = [[], [], []]
  photos.forEach((p, i) => cols[i % 3].push(p))

  return (
    <div className="px-3 sm:px-4 md:px-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-3">
            {col.map(photo => (
              <PhotoCard key={photo.id} photo={photo} hovered={hoveredId === photo.id} onHover={setHoveredId} />
            ))}
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid #1a1a1a', borderTopColor: '#39FF14' }} />
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <div className="text-center py-10">
          <span className="text-xs tracking-widest" style={{ color: '#2a2a2a' }}>― end ―</span>
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, hovered, onHover }: { photo: GalleryPhoto; hovered: boolean; onHover: (id: string | null) => void }) {
  const isVertical = photo.orientation === 'vertical'
  const car = photo.car as any
  const slug = car?.slug
  // Don't render card if model slug is missing — would create broken /cars/ link
  if (!slug) return null
  return (
    <Link
      href={`/cars/${slug}`}
      className="block group relative overflow-hidden card-hover cursor-pointer"
      style={{ borderRadius: 3 }}
      onMouseEnter={() => onHover(photo.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`relative w-full ${isVertical ? 'aspect-[2/3]' : 'aspect-[16/9]'} bg-[#111]`}>
        <Image
          src={photo.thumb_url || photo.url}
          alt={photo.alt_text || photo.caption || car?.title || ''}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => {}}
        />
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)', opacity: hovered ? 1 : 0.65 }} />
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 transition-transform duration-300"
          style={{ transform: hovered ? 'translateY(0)' : 'translateY(3px)' }}>
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wide"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
            {photo.caption || car?.title}
          </p>
          {car?.brand && (
            <p className="text-xs font-medium mt-0.5 tracking-widest uppercase" style={{ color: '#39FF14', opacity: 0.9 }}>
              {car.brand}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
