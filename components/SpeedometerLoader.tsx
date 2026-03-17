'use client'

export default function SpeedometerLoader({ progress = 0 }: { progress?: number }) {
  // progress 0-100 → needle from -130deg to +100deg (total 230deg arc)
  const angle = -130 + (progress / 100) * 230

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        {/* Outer ring */}
        <circle cx="40" cy="40" r="36" stroke="#1a1a1a" strokeWidth="2" />
        {/* Arc track */}
        <circle
          cx="40" cy="40" r="28"
          stroke="#1e1e1e"
          strokeWidth="3"
          fill="none"
          strokeDasharray="147 220"
          strokeDashoffset="-36"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx="40" cy="40" r="28"
          stroke="#39FF14"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${(progress / 100) * 147} 220`}
          strokeDashoffset="-36"
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s ease', filter: 'drop-shadow(0 0 4px #39FF14)' }}
        />
        {/* Center dot */}
        <circle cx="40" cy="40" r="3" fill="#39FF14" />
        {/* Needle */}
        <line
          x1="40" y1="40"
          x2="40" y2="16"
          stroke="#39FF14"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            transformOrigin: '40px 40px',
            transform: `rotate(${angle}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 0 3px #39FF14)',
          }}
        />
        {/* Tick marks */}
        {[0, 46, 92, 138, 184].map((deg, i) => {
          const r = Math.PI * ((deg - 130) / 180)
          const x1 = 40 + 33 * Math.cos(r)
          const y1 = 40 + 33 * Math.sin(r)
          const x2 = 40 + 36 * Math.cos(r)
          const y2 = 40 + 36 * Math.sin(r)
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#333" strokeWidth="1" strokeLinecap="round" />
          )
        })}
      </svg>
      <span
        className="text-xs tracking-widest uppercase font-medium"
        style={{ color: '#39FF14', opacity: 0.7 }}
      >
        Loading
      </span>
    </div>
  )
}
