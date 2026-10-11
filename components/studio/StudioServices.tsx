import type { ReactNode } from 'react'
import hero from '@/public/images/brand/hero.png'
import { SERVICES } from './content'
import { Crop, SectionHeading, delay } from './primitives'
import { SimulationDiagram } from './visuals'

// Regions of the key visual (1672×941 source px). Each frame is 4:5 and shows a different subject.
// These are studio artwork, not project captures — The Kanjo's own image lives in SelectedWork.
const URBAN = { x: 990, y: 0, w: 432, h: 540 }
const FRAME = { x: 1200, y: 400, w: 433, h: 541 }

export default function StudioServices() {
  // Media follow the three services: simulation → diagram, spatial design → lit scene, cinematic → a graded frame.
  const media: ReactNode[] = [
    <div key="sim" className="st-crop st-worlds__media st-ticks">
      <div className="st-crop__zoom"><SimulationDiagram /></div>
      <span className="st-frame-tag st-frame-tag--tl">Fig. 01</span>
      <span className="st-frame-tag st-frame-tag--br">Path · velocity</span>
    </div>,
    <Crop key="urban" src={hero} region={URBAN} className="st-worlds__media st-ticks" frameVw={30} frameMaxPx={420}
      alt="Detail of the studio key visual: lit towers rising over the city at dusk.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 02</span>
      <span className="st-frame-tag st-frame-tag--br">Scene · light</span>
    </Crop>,
    <Crop key="frame" src={hero} region={FRAME} className="st-worlds__media st-ticks" frameVw={30} frameMaxPx={420}
      alt="A cinematic frame from the studio key visual: a white sports car seen from behind, tail lights reflected in wet asphalt.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 03</span>
      <span className="st-frame-tag st-frame-tag--br">Frame · grade</span>
    </Crop>,
  ]

  return (
    <section id="services" className="st-section" aria-labelledby="services-title">
      <div className="st-container">
        <SectionHeading id="services-title" title={SERVICES.title} lead={SERVICES.intro} className="st-section-head" />
        <ul className="st-worlds__grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {SERVICES.items.map((item, i) => (
            <li key={item.n} className="st-worlds__card st-hover" data-reveal="" style={delay(i * 110)}>
              {media[i]}
              <div className="st-worlds__text">
                <h3 className="st-h3"><span className="st-num">{item.n}</span>{item.title}</h3>
                <p className="st-body">{item.body}</p>
                <ul className="st-deliverables" aria-label={`${item.title}: example deliverables`}>
                  {item.deliverables.map(d => <li key={d}>{d}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
