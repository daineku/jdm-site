import type { CSSProperties } from 'react'
import hero from '@/public/images/brand/hero.png'
import { BEHIND } from './content'
import { Arrow, Crop, delay } from './primitives'

// Square region around the half-built block: wireframe, lit floors, road lamps, wet asphalt.
const REGION = { x: 470, y: 200, w: 660, h: 660 }

// Pins in % of the frame, measured on a 10% grid of REGION — locked to the picture because the crop is fixed (see Crop).
const PINS = [
  { x: 22, y: 18, side: 'r', k: 'Environment', v: 'Modular construction' },
  { x: 63, y: 30, side: 'r', k: 'Light', v: 'Interior emissive' },
  { x: 57, y: 70, side: 'l', k: 'Fixtures', v: 'Barrier lamps' },
  { x: 78, y: 86, side: 'l', k: 'Surface', v: 'Wet asphalt response' },
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
            <a href="#work" className="st-btn st-btn--green">Explore our work <Arrow /></a>
          </div>

          <figure style={{ margin: 0 }} data-reveal="">
            <Crop src={hero} region={REGION} className="st-annot" frameVw={52} frameMaxPx={700}
              alt="Detail of the key visual, annotated: a building half in wireframe, lit floors, barrier lamps and wet asphalt.">
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
              Annotated layers: environment construction, interior light, road fixtures and wet surface response.
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
