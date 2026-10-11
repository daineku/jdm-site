import type { ReactNode } from 'react'
import hero from '@/public/images/brand/hero.png'
import { WORLDS } from './content'
import { Crop, SectionHeading, delay } from './primitives'
import { SimulationDiagram } from './visuals'

// Regions of the key visual (1672×941 source px). Each frame is 4:5.
const URBAN = { x: 990, y: 0, w: 432, h: 540 }
const REALISM = { x: 700, y: 330, w: 440, h: 550 }

export default function RealTimeWorlds() {
  const media: ReactNode[] = [
    <Crop key="urban" src={hero} region={URBAN} className="st-worlds__media st-ticks" frameVw={30} frameMaxPx={420}
      alt="Detail of the key visual: lit towers rising over the city at dusk.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 01</span>
      <span className="st-frame-tag st-frame-tag--br">City scale</span>
    </Crop>,
    <div key="sim" className="st-crop st-worlds__media st-ticks">
      <div className="st-crop__zoom"><SimulationDiagram /></div>
      <span className="st-frame-tag st-frame-tag--tl">Fig. 02</span>
      <span className="st-frame-tag st-frame-tag--br">Path · velocity</span>
    </div>,
    <Crop key="realism" src={hero} region={REALISM} className="st-worlds__media st-ticks" frameVw={30} frameMaxPx={420}
      alt="Detail of the key visual: warm interior light, trees and road lamps reflected in wet asphalt.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 03</span>
      <span className="st-frame-tag st-frame-tag--br">Light · surface</span>
    </Crop>,
  ]

  return (
    <section className="st-section" aria-labelledby="worlds-title">
      <div className="st-container">
        <SectionHeading id="worlds-title" title={WORLDS.title} lead={WORLDS.intro} className="st-section-head" />
        <ul className="st-worlds__grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {WORLDS.items.map((item, i) => (
            <li key={item.n} className="st-worlds__card st-hover" data-reveal="" style={delay(i * 110)}>
              {media[i]}
              <div className="st-worlds__text">
                <h3 className="st-h3"><span className="st-num">{item.n}</span>{item.title}</h3>
                <p className="st-body">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
