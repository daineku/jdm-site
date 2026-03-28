'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import SpeedometerLoader from './SpeedometerLoader'
import PhotoGrid from './PhotoGrid'
import type { GalleryPhoto } from '@/lib/types'

const INITIAL_BATCH = 11
const SCROLL_BATCH   = 6

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function applyOrdering(photos: GalleryPhoto[]): GalleryPhoto[] {
  if (photos.length <= 6) return photos
  return [...photos.slice(0, 6), ...shuffle(photos.slice(6))]
}

// Build query URL inline — avoids useCallback dependency instability
function buildUrl(offset: number, limit: number, brandFilter?: string): string {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  if (brandFilter) params.set('brand', brandFilter)
  return `/api/photos?${params}`
}

export default function MasonryGallery({ brandFilter }: { brandFilter?: string }) {
  const [photos, setPhotos]       = useState<GalleryPhoto[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [page, setPage]           = useState(0)
  const [hasMore, setHasMore]     = useState(true)
  const batchSize = SCROLL_BATCH  // fixed — not adaptive
  const loaderRef     = useRef<HTMLDivElement>(null)
  const startTimeRef  = useRef<number>(Date.now())

  // ── FIX 2: fetch lock prevents concurrent requests ──
  const isFetchingRef  = useRef(false)
  // ── FIX 2: ref mirrors page state — readable inside observer callback ──
  // fetchedCountRef tracks total items fetched, used for offset calculation.
  // Must use a ref (not state page*batchSize) because initial and scroll batch
  // sizes differ: initial=11, scroll=6. page*batchSize=1*6=6 would overlap with
  // the first 11 items already fetched.
  const fetchedCountRef = useRef(0)

  // ── FIX 4: initial load depends only on brandFilter (removed buildQuery) ──
  useEffect(() => {
    const load = async () => {
      // Prevent concurrent initial loads (e.g. brandFilter double-fire in dev)
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      setLoading(true); setLoadProgress(0); setPhotos([])
      setPage(0); fetchedCountRef.current = 0; setHasMore(true)
      startTimeRef.current = Date.now()

      const timer = setInterval(() => setLoadProgress(p => Math.min(p + 10, 85)), 100)
      try {
        const res  = await fetch(buildUrl(0, INITIAL_BATCH, brandFilter))
        const json = await res.json()
        const data: GalleryPhoto[] = json.photos || []
        setLoadProgress(100)
        setTimeout(() => {
          setPhotos(applyOrdering(data))
          fetchedCountRef.current = data.length
          setHasMore(data.length === INITIAL_BATCH)
          setLoading(false)
        }, 250)
      } catch {
        setLoading(false)
      } finally {
        clearInterval(timer)
        isFetchingRef.current = false
      }
    }
    load()
  }, [brandFilter])  // ── FIX 4: brandFilter only, no buildQuery ──

  // ── FIX 2: infinite scroll with fetch lock + stable page ref ──
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return

    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return
      // ── FIX 2: guard — one fetch at a time ──
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      // Read current page from ref (not stale closure)
      const nextPage = page + 1
      const offset   = fetchedCountRef.current  // exact count of already-fetched items

      try {
        const res  = await fetch(buildUrl(offset, batchSize, brandFilter))
        const json = await res.json()
        const data: GalleryPhoto[] = json.photos || []
        if (data.length > 0) {
          setPhotos(prev => [...prev, ...shuffle(data)])
          // ── FIX 2: update both state and ref ──
          fetchedCountRef.current += data.length
          setPage(nextPage)
          setHasMore(data.length === batchSize)
        } else {
          setHasMore(false)
        }
      } catch {
        setHasMore(false)
      } finally {
        // ── FIX 2: always release lock ──
        isFetchingRef.current = false
      }
    }, { threshold: 0.1 })

    const el = loaderRef.current
    observer.observe(el)
    return () => observer.disconnect()
    // ── FIX 4: removed page and buildQuery from deps ──
    // offset read from fetchedCountRef (not page*batchSize — batches have different sizes)
  }, [loaderRef, hasMore, loading, batchSize, brandFilter])

  if (loading) return <SpeedometerLoader progress={loadProgress} />

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-xs tracking-widest uppercase" style={{ color: '#333' }}>No photos yet</p>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <PhotoGrid
        photos={photos}
        gap={3}
        getHref={photo => {
          const slug = photo.car?.slug
          return slug ? `/cars/${slug}` : null
        }}
      />
      {hasMore && (
        <div ref={loaderRef}>
          <SpeedometerLoader compact progress={75} />
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
