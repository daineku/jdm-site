import hero from '@/public/images/brand/hero.png'
import { KANJO_URL, WORK } from './content'
import { Arrow, Crop, SectionHeading, delay } from './primitives'
import { MaterialStudyPanel, RoadNetworkPanel } from './visuals'

// Wide 16:11 region: river skyline, the half-built wireframe block and the curving road —
// deliberately without the car, which the hero already shows.
const KANJO = { x: 0, y: 150, w: 1100, h: 756 }

const PANELS = [RoadNetworkPanel, MaterialStudyPanel]

export default function SelectedWork() {
  const { kanjo, research } = WORK
  return (
    <section id="work" className="st-section st-work" aria-labelledby="work-title">
      <div className="st-container">
        <SectionHeading id="work-title" title={WORK.title} lead={WORK.subtitle} className="st-section-head" />

        <article className="st-case st-hover" aria-labelledby="kanjo-title">
          <Crop src={hero} region={KANJO} className="st-case__media st-ticks" frameVw={56} frameMaxPx={740}
            alt="The Kanjo: a river skyline at dusk, a building shown half as wireframe, and a wet elevated road curving through the city.">
            <span className="st-frame-tag st-frame-tag--tl">The Kanjo</span>
            <span className="st-frame-tag st-frame-tag--br">Work in progress</span>
          </Crop>

          <div className="st-case__copy" data-reveal="">
            <p className="st-label" style={{ margin: 0 }}>{kanjo.category}</p>
            <p className="st-case__name" style={{ margin: 0 }}>{kanjo.name}</p>
            <h3 id="kanjo-title" className="st-h2 st-case__headline">{kanjo.headline}</h3>
            {kanjo.body.map(p => <p key={p.slice(0, 24)} className="st-body">{p}</p>)}
            <dl className="st-facts">
              {kanjo.facts.map(f => (
                <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
              ))}
            </dl>
            <a href={KANJO_URL} target="_blank" rel="noopener" className="st-btn st-btn--gold" style={{ justifySelf: 'start' }}>
              {kanjo.cta} <Arrow diagonal /><span className="st-visually-hidden"> (opens thekanjo.com in a new tab)</span>
            </a>
          </div>
        </article>

        <div className="st-research">
          {research.map((r, i) => {
            const Panel = PANELS[i]
            return (
              <article key={r.title} className="st-research__panel" data-reveal="" style={delay(i * 120)}>
                <div className="st-research__visual"><Panel /></div>
                <div className="st-research__copy">
                  <p className="st-label" style={{ margin: 0 }}>{r.label}</p>
                  <h3 className="st-h3">{r.title}</h3>
                  <p className="st-body">{r.body}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
