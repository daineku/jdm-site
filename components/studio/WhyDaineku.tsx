import { WHY } from './content'
import { delay } from './primitives'
import { CompositionGlyph, FramingGlyph, InteractionGlyph } from './visuals'

// Functional worlds → massing, Prototype in real time → input states, One environment → camera framing.
const GLYPHS = [CompositionGlyph, InteractionGlyph, FramingGlyph]

export default function WhyDaineku() {
  return (
    <section id="why" className="st-section st-design" aria-labelledby="why-title">
      <div className="st-container st-design__layout">
        <div className="st-design__intro" data-reveal="">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{WHY.label}</p>
          <h2 id="why-title" className="st-h2">{WHY.title}</h2>
          <p className="st-lead">{WHY.body}</p>
        </div>
        <ol className="st-design__list">
          {WHY.items.map((item, i) => {
            const Glyph = GLYPHS[i]
            return (
              <li key={item.title} className="st-design__row" data-reveal="" style={delay(i * 90)}>
                <div className="st-design__visual"><Glyph /></div>
                <div className="st-design__copy">
                  <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="st-h3">{item.title}</h3>
                  <p className="st-body">{item.body}</p>
                  {item.evidence && <p className="st-evidence"><span className="st-label">Evidence</span> {item.evidence}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
