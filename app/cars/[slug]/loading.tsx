'use client'
import { useState, useEffect } from 'react'
import SpeedometerLoader from '@/components/SpeedometerLoader'

// Shown by Next.js App Router while model page server component fetches data.
// Animates progress 0→85 over ~2s so the needle visibly moves.
export default function ModelLoading() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(timer); return 85 }
        return p + 8
      })
    }, 120)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
    }}>
      <SpeedometerLoader progress={progress} />
    </div>
  )
}
