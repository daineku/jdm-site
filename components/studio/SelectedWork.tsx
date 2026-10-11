import kanjoHero from '@/public/images/projects/thekanjo-hero.webp'
import { KANJO_URL, WORK, type SystemStatus } from './content'
import { Arrow, Cover, SectionHeading, delay } from './primitives'

// The Kanjo's own approved hero (daineku/kanjo public/media/hero/hero.png, 6336×2688), resized to
// 2560px WebP. The red car sits at x 47–88% of the frame; the 16:11 frame shows ~62% of the width,
// so both framings are pulled right of centre. 72% 50% is the source's own phone framing; the
// desktop keeps the source's vertical 58% so the road carries the bottom of the frame.
const POSITION = '70% 58%'
const MOBILE_POSITION = '72% 50%'

const STATUS_LABEL: Record<SystemStatus, string> = { implemented: 'Implemented', progress: 'In progress' }

export default function SelectedWork() {
  const { kanjo } = WORK
  return (
    <section id="work" className="st-section st-work" aria-labelledby="work-title">
      <div className="st-container">
        <SectionHeading id="work-title" title={WORK.title} lead={WORK.subtitle} className="st-section-head" />

        <article className="st-case st-hover" aria-labelledby="kanjo-title">
          <Cover src={kanjoHero} alt={kanjo.image.alt} position={POSITION} mobilePosition={MOBILE_POSITION}
            className="st-case__media st-ticks" sizes="(max-width: 899px) 100vw, min(56vw, 740px)">
            <span className="st-frame-tag st-frame-tag--tl">The Kanjo</span>
            <span className="st-frame-tag st-frame-tag--br">In development</span>
          </Cover>

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

        {/* The technical proof sits with the project it comes from, under its own artwork. */}
        <section className="st-systems" aria-labelledby="systems-title">
          <div className="st-systems__head" data-reveal="">
            <h3 id="systems-title" className="st-label st-label--rule" style={{ margin: 0 }}>{kanjo.systems.title}</h3>
            <p className="st-body">{kanjo.systems.intro}</p>
          </div>
          <ol className="st-systems__list">
            {kanjo.systems.items.map((item, i) => (
              <li key={item.title} data-reveal="" style={delay(i * 80)}>
                <div className="st-systems__title">
                  <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="st-h3">{item.title}</h4>
                </div>
                <p className={`st-status st-status--${item.status}`}>{STATUS_LABEL[item.status]}</p>
                <p className="st-body">{item.body}</p>
                <ul className="st-deliverables" aria-label={`${item.title}: what was built`}>
                  {item.built.map(d => <li key={d}>{d}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
