import kanjoHero from '@/public/images/projects/thekanjo-hero.webp'
import { KANJO_URL, WORK } from './content'
import { Arrow, Cover, SectionHeading, delay } from './primitives'

// Preserve the approved composition of The Kanjo's own project hero.
const POSITION = '70% 58%'
const MOBILE_POSITION = '72% 50%'

export default function SelectedWork() {
  const { kanjo } = WORK
  return (
    <section id="work" className="st-section st-work" aria-labelledby="work-title">
      <div className="st-container">
        <SectionHeading id="work-title" title={WORK.title} className="st-section-head" />

        <article className="st-case st-hover" aria-labelledby="kanjo-title">
          <Cover src={kanjoHero} alt={kanjo.image.alt} position={POSITION} mobilePosition={MOBILE_POSITION}
            className="st-case__media st-ticks" sizes="(max-width: 899px) 100vw, min(56vw, 740px)">
            <span className="st-frame-tag st-frame-tag--tl">The Kanjo</span>
            <span className="st-frame-tag st-frame-tag--br">In development</span>
          </Cover>

          <div className="st-case__copy" data-reveal="">
            <p className="st-label" style={{ margin: 0 }}>{kanjo.category}</p>
            <h3 id="kanjo-title" className="st-h2 st-case__headline">{kanjo.headline}</h3>
            {kanjo.body.map(p => <p key={p.slice(0, 24)} className="st-body">{p}</p>)}
            <a href={KANJO_URL} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--gold" style={{ justifySelf: 'start' }}>
              {kanjo.cta} <Arrow diagonal /><span className="st-visually-hidden"> (opens thekanjo.com in a new tab)</span>
            </a>
          </div>
        </article>

        <section className="st-systems" aria-labelledby="systems-title">
          <div className="st-systems__head" data-reveal="">
            <h3 id="systems-title" className="st-h3">{kanjo.systems.title}</h3>
          </div>
          <ul className="st-systems__list">
            {kanjo.systems.items.map((item, i) => (
              <li key={item.title} data-reveal="" style={delay(i * 70)}>
                <div className="st-systems__title">
                  <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="st-h3">{item.title}</h4>
                </div>
                <p className="st-body">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
