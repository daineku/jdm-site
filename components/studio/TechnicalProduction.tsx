import type { CSSProperties } from 'react'
import hero from '@/public/images/brand/hero.png'
import { TECHNICAL } from './content'
import { Crop, delay } from './primitives'

// Tight square study of the half-built block in the studio key visual: wireframe massing, lit
// floors, facade, barrier. It illustrates environment layers in general — it is not a Kanjo frame,
// and its tag says so.
const REGION = { x: 500, y: 170, w: 500, h: 500 }

// Pins in % of the frame, measured on a 10% grid of REGION — locked to the picture because the crop is fixed (see Crop).
const PINS = [
  { x: 24, y: 32, side: 'r', k: 'Environment', v: 'Modular construction' },
  { x: 70, y: 18, side: 'l', k: 'Light', v: 'Interior emissive' },
  { x: 76, y: 54, side: 'l', k: 'Material', v: 'Concrete · glass' },
  { x: 30, y: 86, side: 'r', k: 'Geometry', v: 'Barrier mesh' },
] as const

// The Kanjo is linked once, from Selected Work; this section adds evidence, not another link.
export default function TechnicalProduction() {
  return (
    <section id="technical" className="st-section" aria-labelledby="technical-title" style={{ paddingTop: 0 }}>
      <div className="st-band">
        <div className="st-container" data-reveal="">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{TECHNICAL.label}</p>
          <h2 id="technical-title" className="st-h2">{TECHNICAL.title}</h2>
        </div>
      </div>

      <div className="st-container" style={{ paddingTop: 'var(--st-section-y)' }}>
        <div className="st-behind__split">
          <div className="st-behind__copy" data-reveal="">
            <p className="st-lead" style={{ color: 'var(--st-text)' }}>{TECHNICAL.body}</p>
          </div>

          <figure style={{ margin: 0 }} data-reveal="">
            <Crop src={hero} region={REGION} className="st-annot" frameVw={52} frameMaxPx={700}
              alt="Detail of the studio key visual, annotated: a building half in wireframe, its lit floors, facade materials and the road barrier mesh.">
              <span className="st-frame-tag st-frame-tag--tl">Studio key visual · layers</span>
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
              Environment layers in the studio key visual: construction, interior light, facade materials and barrier geometry.
            </figcaption>
          </figure>
        </div>

        <ol className="st-components">
          {TECHNICAL.items.map((item, i) => (
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
