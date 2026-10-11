/**
 * Art-directed vector panels. They illustrate *how* the studio thinks (paths,
 * light, structure) rather than pretending to be screenshots, and every one can
 * be swapped for a real capture later without layout changes.
 * All are decorative: the adjacent copy carries the meaning, so they are aria-hidden.
 */

const GOLD = '#FCCC00'
const IVORY = '#F4F5F0'
const GREEN = '#0B5C37'

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
      <g fontFamily="var(--font-display), sans-serif" fontSize="9" letterSpacing="1.6" fill={IVORY} fillOpacity="0.55">
        <text x="118" y="456">T+0.0</text>
        <text x="180" y="384">T+0.5</text>
        <text x="240" y="318">T+1.0</text>
      </g>
    </svg>
  )
}

/** Design 01 — massing study in perspective. viewBox 240×180. */
export function CompositionGlyph() {
  return (
    <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke={IVORY} strokeOpacity="0.1">
        {[-120, -60, 0, 60, 120, 180, 240, 300, 360].map(x => <line key={x} x1="120" y1="40" x2={x} y2="180" />)}
      </g>
      <line x1="0" y1="40" x2="240" y2="40" stroke={IVORY} strokeOpacity="0.2" />
      <g fill="none" stroke={IVORY} strokeOpacity="0.55" strokeWidth="1">
        <path d="M 46 150 L 46 70 L 74 58 L 74 138 Z" />
        <path d="M 74 58 L 98 66 L 98 146 L 74 138" />
        <path d="M 150 140 L 150 92 L 168 86 L 168 134 Z" />
        <path d="M 168 86 L 196 94 L 196 142 L 168 134" />
      </g>
      <g fill={GOLD} fillOpacity="0.12" stroke={GOLD} strokeWidth="1.2">
        <path d="M 104 160 L 104 34 L 126 24 L 126 150 Z" />
        <path d="M 126 24 L 144 31 L 144 157 L 126 150 Z" fillOpacity="0.05" />
      </g>
    </svg>
  )
}

/** Design 02 — states connected by player input. viewBox 240×180. */
export function InteractionGlyph() {
  return (
    <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" strokeWidth="1.2">
        <path d="M 52 120 C 70 60, 104 52, 120 62" stroke={IVORY} strokeOpacity="0.4" />
        <path d="M 120 62 C 150 80, 166 120, 188 118" stroke={GOLD} />
        <path d="M 52 120 C 100 150, 150 150, 188 118" stroke={IVORY} strokeOpacity="0.2" strokeDasharray="4 5" />
      </g>
      <circle cx="52" cy="120" r="9" fill="#050806" stroke={IVORY} strokeOpacity="0.6" />
      <circle cx="120" cy="62" r="9" fill="#050806" stroke={IVORY} strokeOpacity="0.6" />
      <circle cx="188" cy="118" r="11" fill={GOLD} fillOpacity="0.16" stroke={GOLD} />
      <circle cx="188" cy="118" r="3.5" fill={GOLD} />
      <circle cx="188" cy="118" r="20" fill="none" stroke={GOLD} strokeOpacity="0.25" />
      <path d="M 150 40 L 150 62 L 156 56 L 161 66 L 165 64 L 160 54 L 168 54 Z" fill={IVORY} fillOpacity="0.85" />
    </svg>
  )
}

/** Design 03 — a camera frustum framing the same massing; thirds grid and a tracked path. viewBox 240×180. */
export function FramingGlyph() {
  return (
    <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke={IVORY} strokeOpacity="0.28" fill="none">
        <path d="M 30 146 L 120 40 M 30 146 L 120 140 M 30 146 L 212 40 M 30 146 L 212 140" strokeDasharray="3 4" />
      </g>
      <rect x="120" y="40" width="92" height="100" fill={IVORY} fillOpacity="0.03" stroke={IVORY} strokeOpacity="0.6" />
      <g stroke={IVORY} strokeOpacity="0.16">
        <line x1="150.7" y1="40" x2="150.7" y2="140" /><line x1="181.3" y1="40" x2="181.3" y2="140" />
        <line x1="120" y1="73.3" x2="212" y2="73.3" /><line x1="120" y1="106.7" x2="212" y2="106.7" />
      </g>
      <g fill={GOLD} fillOpacity="0.12" stroke={GOLD} strokeWidth="1.2">
        <path d="M 142 128 L 142 66 L 156 60 L 156 122 Z" />
        <path d="M 156 60 L 168 64 L 168 126 L 156 122 Z" fillOpacity="0.05" />
      </g>
      <path d="M 124 132 C 150 118, 176 124, 208 100" fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="1.2" />
      <rect x="18" y="138" width="18" height="14" rx="2" fill="#050806" stroke={GOLD} />
      <circle cx="27" cy="145" r="3" fill={GOLD} />
      <path d="M 114 40 L 120 40 L 120 46 M 206 40 L 212 40 L 212 46 M 114 140 L 120 140 L 120 134 M 206 140 L 212 140 L 212 134" fill="none" stroke={GOLD} strokeWidth="1.4" />
    </svg>
  )
}

/** Research 01 — a district road graph with one traced route. viewBox 400×300. */
export function RoadNetworkPanel() {
  const blocks: [number, number, number, number][] = [
    [18, 22, 64, 44], [96, 22, 52, 44], [162, 14, 70, 52], [246, 22, 58, 40], [318, 10, 70, 56],
    [18, 82, 46, 58], [78, 82, 70, 40], [252, 76, 40, 58], [306, 82, 82, 40],
    [18, 156, 70, 50], [102, 136, 46, 70], [300, 136, 88, 44],
    [18, 222, 56, 60], [88, 222, 62, 34], [222, 200, 64, 46], [300, 194, 40, 52], [354, 194, 34, 88],
    [88, 270, 60, 24], [222, 260, 118, 30],
  ]
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="#04140c" />
      <g fill={IVORY} fillOpacity="0.035" stroke={IVORY} strokeOpacity="0.14">
        {blocks.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
      </g>
      <g fill="none" stroke={IVORY} strokeOpacity="0.35" strokeWidth="1">
        <path d="M 160 -10 C 170 70, 186 150, 196 310" />
        <path d="M -10 150 C 90 140, 260 132, 410 128" />
      </g>
      <path d="M -10 248 C 70 236, 130 196, 196 168 S 310 92, 410 70" fill="none" stroke={GREEN} strokeWidth="9" strokeOpacity="0.55" />
      <path d="M -10 248 C 70 236, 130 196, 196 168 S 310 92, 410 70" fill="none" stroke={GOLD} strokeWidth="1.5" />
      {[[196, 168], [189, 136], [93, 222], [318, 104]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" fill="none" stroke={GOLD} strokeOpacity="0.35" />
          <circle cx={x} cy={y} r="2.6" fill={GOLD} />
        </g>
      ))}
    </svg>
  )
}

/** Research 02 — diffuse / metal / clearcoat response under one key light. viewBox 400×300. */
export function MaterialStudyPanel() {
  const spheres = [
    { cx: 92, id: 'm-diffuse', base: ['#e9e7de', '#8c8b84', '#1d1f1c'], spec: 0.25, specR: 26 },
    { cx: 200, id: 'm-metal', base: ['#cfd3d0', '#3a3f3c', '#0b0d0c'], spec: 0.95, specR: 8 },
    { cx: 308, id: 'm-coat', base: ['#1d8a57', '#0b4a2c', '#03170d'], spec: 1, specR: 5 },
  ]
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="m-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#030806" />
          <stop offset="0.62" stopColor="#0a1a12" />
          <stop offset="0.62" stopColor="#0d2117" />
          <stop offset="1" stopColor="#050c08" />
        </linearGradient>
        {spheres.map(s => (
          <radialGradient key={s.id} id={s.id} cx="0.36" cy="0.32" r="0.75">
            <stop offset="0" stopColor={s.base[0]} />
            <stop offset="0.55" stopColor={s.base[1]} />
            <stop offset="1" stopColor={s.base[2]} />
          </radialGradient>
        ))}
        <radialGradient id="m-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.75" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="m-env" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={IVORY} stopOpacity="0" />
          <stop offset="0.5" stopColor={IVORY} stopOpacity="0.35" />
          <stop offset="1" stopColor={IVORY} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#m-bg)" />
      {spheres.map(s => (
        <g key={s.id}>
          <ellipse cx={s.cx} cy="216" rx="44" ry="8" fill="url(#m-shadow)" />
          <circle cx={s.cx} cy="168" r="44" fill={`url(#${s.id})`} />
          {s.id !== 'm-diffuse' && (
            <path d={`M ${s.cx - 42} 178 Q ${s.cx} 190 ${s.cx + 42} 178 L ${s.cx + 40} 186 Q ${s.cx} 197 ${s.cx - 40} 186 Z`} fill="url(#m-env)" />
          )}
          <circle cx={s.cx - 15} cy="150" r={s.specR} fill="#fff" fillOpacity={s.spec * 0.85} />
          <path d={`M ${s.cx + 28} 140 A 44 44 0 0 1 ${s.cx + 40} 186`} fill="none" stroke={GOLD} strokeOpacity={s.id === 'm-diffuse' ? 0.15 : 0.45} strokeWidth="1.2" />
        </g>
      ))}
      <g fontFamily="var(--font-display), sans-serif" fontSize="9" letterSpacing="2" fill={IVORY} fillOpacity="0.6" textAnchor="middle">
        <text x="92" y="250">DIFFUSE</text>
        <text x="200" y="250">METAL</text>
        <text x="308" y="250">CLEARCOAT</text>
      </g>
      <circle cx="40" cy="40" r="3" fill={GOLD} />
      <line x1="46" y1="46" x2="70" y2="70" stroke={GOLD} strokeOpacity="0.5" strokeDasharray="3 4" />
    </svg>
  )
}
