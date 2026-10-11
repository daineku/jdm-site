import type { CSSProperties } from 'react'
import hero from '@/public/images/brand/hero.png'
import { BEHIND, KANJO_URL } from './content'
import { Arrow, Crop, delay } from './primitives'

// Tight square study of the half-built block: wireframe massing, lit floors, facade, barrier.
const REGION = { x: 500, y: 170, w: 500, h: 500 }

// Pins in % of the frame, measured on a 10% grid of REGION — locked to the picture because the crop is fixed (see Crop).
const PINS = [
  { x: 24, y: 32, side: 'r', k: 'Environment', v: 'Modular construction' },
  { x: 70, y: 18, side: 'l', k: 'Light', v: 'Interior emissive' },
  { x: 76, y: 54, side: 'l', k: 'Material', v: 'Concrete · glass' },
  { x: 30, y: 86, side: 'r', k: 'Geometry', v: 'Barrier mesh' },
] as const

export default function BehindSimulation() {
  return (
    <section className="st-section" aria-labelledby="behind-title" style={{ paddingTop: 0 }}>
      <div className="st-band">
        <div className="st-container" data-reveal="">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{BEHIND.label}</p>
          <h2 id="behind-title" className="st-h2">{BEHIND.title}</h2>
        </div>
      </div>

      <div className="st-container" style={{ paddingTop: 'var(--st-section-y)' }}>
        <div className="st-behind__split">
          <div className="st-behind__copy" data-reveal="">
            {BEHIND.body.map((p, i) => (
              <p key={p.slice(0, 24)} className={i === 0 ? 'st-lead' : 'st-body'} style={i === 0 ? { color: 'var(--st-text)' } : undefined}>{p}</p>
            ))}
            <a href={KANJO_URL} target="_blank" rel="noopener" className="st-btn st-btn--green">
              {BEHIND.cta} <Arrow diagonal /><span className="st-visually-hidden"> (opens thekanjo.com in a new tab)</span>
            </a>
          </div>

          <figure style={{ margin: 0 }} data-reveal="">
            <Crop src={hero} region={REGION} className="st-annot" frameVw={52} frameMaxPx={700}
              alt="Detail of the key visual, annotated: a building half in wireframe, its lit floors, facade materials and the road barrier mesh.">
              {PINS.map(p => (
                <span key={p.k} className="st-annot__pin" style={{ '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties}>
                  <span className="st-annot__dot" />
                  <span className={`st-annot__tag st-annot__tag--${p.side}`}>
                    <b>{p.k}</b>
                    <span>{p.v}</span>
                  </span>
                </span>
              ))}
            </Crop>
            <figcaption className="st-visually-hidden">
              Annotated layers: environment construction, interior light, facade materials and barrier geometry.
            </figcaption>
          </figure>
        </div>

        <ol className="st-components">
          {BEHIND.items.map((item, i) => (
            <li key={item.n} data-reveal="" style={delay(i * 90)}>
              <span className="st-num">{item.n}</span>
              <h3 className="st-h3">{item.title}</h3>
              <p className="st-body">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
