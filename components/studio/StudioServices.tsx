import type { ReactNode } from 'react'
import urban from '@/public/images/brand/hero-crop-urban.jpg'
import frame from '@/public/images/brand/hero-crop-frame.jpg'
import { SERVICES } from './content'
import { Cover, SectionHeading, delay } from './primitives'
import { SimulationDiagram } from './visuals'

// Two details of the key visual, each cut from hero.png as its own 4:5 file
// (scripts/prepare-brand-crops.mjs) so the cards never re-download the whole hero.
// These are studio artwork, not project captures — The Kanjo's own image lives in SelectedWork.
const FRAME_SIZES = '(max-width: 899px) 100vw, min(30vw, 420px)'

export default function StudioServices() {
  // Media follow the three services: simulation → diagram, spatial design → lit scene, cinematic → a graded frame.
  const media: ReactNode[] = [
    <div key="sim" className="st-crop st-worlds__media st-ticks">
      <div className="st-crop__zoom"><SimulationDiagram /></div>
      <span className="st-frame-tag st-frame-tag--tl">Fig. 01</span>
      <span className="st-frame-tag st-frame-tag--br">Path · velocity</span>
    </div>,
    <Cover key="urban" src={urban} position="50% 50%" sizes={FRAME_SIZES} className="st-worlds__media st-ticks"
      alt="Detail of the studio key visual: lit towers rising over the city at dusk.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 02</span>
      <span className="st-frame-tag st-frame-tag--br">Scene · light</span>
    </Cover>,
    <Cover key="frame" src={frame} position="50% 50%" sizes={FRAME_SIZES} className="st-worlds__media st-ticks"
      alt="A cinematic frame from the studio key visual: a white sports car seen from behind, tail lights reflected in wet asphalt.">
      <span className="st-frame-tag st-frame-tag--tl">Fig. 03</span>
      <span className="st-frame-tag st-frame-tag--br">Frame · grade</span>
    </Cover>,
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
