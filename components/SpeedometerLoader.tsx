'use client'

interface SpeedometerLoaderProps {
  progress?: number
  compact?: boolean   // smaller inline variant for scroll sentinel
}

export default function SpeedometerLoader({ progress = 0, compact = false }: SpeedometerLoaderProps) {
  const angle = -130 + (progress / 100) * 230
  const size  = compact ? 36 : 80
  const cx    = size / 2
  const outerR = compact ? 16 : 36
  const trackR = compact ? 11 : 28
  const sw     = compact ? 2   : 3
  const trackDA    = compact ? 58  : 147
  const trackTotal = compact ? 87  : 220
  const trackOff   = compact ? -14 : -36
  const needleY2   = compact ? cx - (size * 0.3) : 16

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: compact ? '12px 0' : '80px 0' }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <circle cx={cx} cy={cx} r={outerR} stroke="#1a1a1a" strokeWidth={compact ? 1 : 2} />
        <circle
          cx={cx} cy={cx} r={trackR}
          stroke="#1e1e1e" strokeWidth={sw} fill="none"
          strokeDasharray={`${trackDA} ${trackTotal}`}
          strokeDashoffset={trackOff}
          strokeLinecap="round"
        />
        <circle
          cx={cx} cy={cx} r={trackR}
          stroke="#39FF14" strokeWidth={sw} fill="none"
          strokeDasharray={`${(progress / 100) * trackDA} ${trackTotal}`}
          strokeDashoffset={trackOff}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s ease', filter: 'drop-shadow(0 0 4px #39FF14)' }}
        />
        <circle cx={cx} cy={cx} r={compact ? 1.5 : 3} fill="#39FF14" />
        <line
          x1={cx} y1={cx} x2={cx} y2={needleY2}
          stroke="#39FF14" strokeWidth={compact ? 1 : 1.5} strokeLinecap="round"
          style={{
            transformOrigin: `${cx}px ${cx}px`,
            transform: `rotate(${angle}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 0 3px #39FF14)',
          }}
        />
        {[0, 46, 92, 138, 184].map((deg, i) => {
          const r  = Math.PI * ((deg - 130) / 180)
          const r1 = outerR - (compact ? 2 : 3)
          const x1 = cx + r1 * Math.cos(r)
          const y1 = cx + r1 * Math.sin(r)
          const x2 = cx + outerR * Math.cos(r)
          const y2 = cx + outerR * Math.sin(r)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="1" strokeLinecap="round" />
        })}
      </svg>
    </div>
  )
}
