import { PROCESS } from './content'
import { SectionDivider, delay } from './primitives'

export default function ProcessSection() {
  return (
    <section id="process" className="st-section st-ivory" aria-labelledby="process-title" style={{ paddingTop: 0 }}>
      <SectionDivider />
      <div className="st-container st-process__layout" style={{ paddingTop: 'clamp(48px, 6vw, 88px)' }}>
        <div className="st-process__intro" data-reveal="">
          <span className="st-chip"><span className="st-label">{PROCESS.label}</span></span>
          <h2 id="process-title" className="st-h2">{PROCESS.title}</h2>
          <p className="st-lead">{PROCESS.body}</p>
        </div>
        <ol className="st-process__cards">
          {PROCESS.steps.map((step, i) => (
            <li key={step.n} data-reveal="" style={delay(i * 100)}>
              <div className="st-step">
                <span className="st-outline-num st-step__num" aria-hidden="true">{step.n}</span>
                <h3 className="st-h3">{step.title}</h3>
                <p className="st-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
