/**
 * Art-directed vector panels. They illustrate *how* the studio thinks (paths,
 * light, structure) rather than pretending to be screenshots, and every one can
 * be swapped for a real capture later without layout changes.
 * All are decorative: the adjacent copy carries the meaning, so they are aria-hidden.
 */

const GOLD = '#FCCC00'
const IVORY = '#F4F5F0'

/** Worlds 02 — vehicle path sampled through a perspective floor. viewBox 400×500. */
export function SimulationDiagram() {
  const cars = [
    { x: 91.8, y: 448.3, a: -53.7, s: 1, o: 1 },
    { x: 160.8, y: 369.5, a: -45.7, s: 0.8, o: 0.7 },
    { x: 228, y: 301.5, a: -46, s: 0.62, o: 0.45 },
    { x: 286.3, y: 235.8, a: -51.8, s: 0.48, o: 0.28 },
  ]
  const verticals = Array.from({ length: 15 }, (_, i) => -360 + i * 80)
  const horizontals = [500, 430, 372, 326, 290, 262, 240, 223, 210, 200]
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sim-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050806" />
          <stop offset="0.45" stopColor="#07140d" />
          <stop offset="1" stopColor="#0b2216" />
        </linearGradient>
        <linearGradient id="sim-road" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={IVORY} stopOpacity="0.5" />
          <stop offset="1" stopColor={IVORY} stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="sim-glow" cx="0.2" cy="0.95" r="0.6">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.16" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <clipPath id="sim-floor"><rect x="0" y="196" width="400" height="304" /></clipPath>
      </defs>
      <rect width="400" height="500" fill="url(#sim-bg)" />
      <rect width="400" height="500" fill="url(#sim-glow)" />
      {/* wireframe skyline on the horizon — the world the simulation runs in */}
      <g fill="none" stroke={IVORY} strokeOpacity="0.15" strokeWidth="0.8">
        {[[14, 120, 34], [52, 92, 26], [84, 140, 40], [130, 60, 22], [158, 112, 30], [196, 36, 24], [226, 98, 36], [270, 70, 20], [296, 128, 42], [344, 84, 28], [376, 150, 30]].map(([x, top, w]) => (
          <g key={x}>
            <rect x={x} y={top} width={w} height={196 - top} />
            {Array.from({ length: Math.floor((196 - top) / 14) }, (_, k) => (
              <line key={k} x1={x} y1={top + 14 * (k + 1)} x2={x + w} y2={top + 14 * (k + 1)} strokeOpacity="0.35" />
            ))}
          </g>
        ))}
      </g>
      <g fill={GOLD} fillOpacity="0.75">
        {[[201, 64], [211, 92], [235, 120], [305, 150], [61, 134], [167, 140], [349, 112]].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="3" />)}
      </g>
      <line x1="0" y1="196" x2="400" y2="196" stroke={IVORY} strokeOpacity="0.18" />
      <g clipPath="url(#sim-floor)" stroke={IVORY} strokeOpacity="0.07">
        {verticals.map(x => <line key={x} x1="200" y1="150" x2={x} y2="500" />)}
        {horizontals.map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
      </g>
      {/* carriageway edges */}
      <path d="M -10 500 C 70 365, 225 290, 314 196" fill="none" stroke="url(#sim-road)" strokeWidth="1.2" />
      <path d="M 150 500 C 192 400, 300 320, 348 196" fill="none" stroke="url(#sim-road)" strokeWidth="1.2" />
      {/* predicted trajectory */}
      <path d="M 60 500 C 120 380, 260 300, 330 196" fill="none" stroke={GOLD} strokeWidth="1.4" strokeDasharray="5 7" strokeOpacity="0.9" />
      {cars.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.a}) scale(${c.s})`} opacity={c.o}>
          <rect x="-16" y="-9" width="32" height="18" rx="3" fill="none" stroke={IVORY} strokeWidth={1.2 / c.s} />
          <rect x="4" y="-6" width="7" height="12" rx="1.5" fill={IVORY} fillOpacity="0.3" />
          <line x1="16" y1="0" x2="34" y2="0" stroke={GOLD} strokeWidth={1.2 / c.s} />
          <path d="M 30 -3 L 35 0 L 30 3" fill="none" stroke={GOLD} strokeWidth={1.2 / c.s} />
        </g>
      ))}
      <g fontFamily="var(--st-font-display)" fontSize="9" letterSpacing="1.6" fill={IVORY} fillOpacity="0.55">
        <text x="118" y="456">T+0.0</text>
        <text x="180" y="384">T+0.5</text>
        <text x="240" y="318">T+1.0</text>
      </g>
    </svg>
  )
}
