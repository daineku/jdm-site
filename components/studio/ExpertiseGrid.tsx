import { EXPERTISE } from './content'
import { SectionDivider, SectionHeading, delay } from './primitives'

export default function ExpertiseGrid() {
  return (
    <section id="expertise" className="st-section st-ivory" aria-labelledby="expertise-title" style={{ paddingTop: 0 }}>
      <SectionDivider />
      <div className="st-container" style={{ paddingTop: 'clamp(48px, 6vw, 88px)' }}>
        <SectionHeading id="expertise-title" title={EXPERTISE.title} lead={EXPERTISE.subtitle} className="st-section-head" />
        <ul className="st-expertise__grid">
          {EXPERTISE.items.map((item, i) => (
            <li key={item.n} className="st-skill" data-reveal="" style={delay((i % 2) * 100)}>
              <span className="st-outline-num st-skill__num" aria-hidden="true">{item.n}</span>
              <div className="st-skill__copy">
                <h3 className="st-h3">{item.title}</h3>
                <p className="st-body">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
