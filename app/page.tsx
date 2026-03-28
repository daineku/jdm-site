'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MasonryGallery from '@/components/MasonryGallery'
import SpeedometerLoader from '@/components/SpeedometerLoader'

function HomeContent() {
  const searchParams = useSearchParams()
  const brand = searchParams.get('brand') || undefined

  return (
    <main className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      <div className="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-6">
        {brand && (
          <div className="pt-6 pb-2">
            <p className="text-xs tracking-widest uppercase" style={{ color: '#39FF14' }}>
              <a href="/" style={{ color: '#555' }}>All</a>
              <span style={{ color: '#333', margin: '0 6px' }}>/</span>
              <span style={{ color: '#39FF14' }}>{brand}</span>
            </p>
          </div>
        )}
        <MasonryGallery brandFilter={brand} />
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<SpeedometerLoader progress={30} />}>
      <HomeContent />
    </Suspense>
  )
}
