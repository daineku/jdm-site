import { DESIGN } from './content'
import { delay } from './primitives'
import { CompositionGlyph, FramingGlyph, InteractionGlyph } from './visuals'

// Build the world → massing, Make it respond → input states, Capture the experience → camera framing.
const GLYPHS = [CompositionGlyph, InteractionGlyph, FramingGlyph]

export default function DesignExperience() {
  return (
    <section className="st-section st-design" aria-labelledby="design-title">
      <div className="st-container st-design__layout">
        <div className="st-design__intro" data-reveal="">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{DESIGN.label}</p>
          <h2 id="design-title" className="st-h2">{DESIGN.title}</h2>
          <p className="st-lead">{DESIGN.body}</p>
        </div>
        <ol className="st-design__list">
          {DESIGN.items.map((item, i) => {
            const Glyph = GLYPHS[i]
            return (
              <li key={item.title} className="st-design__row" data-reveal="" style={delay(i * 90)}>
                <div className="st-design__visual"><Glyph /></div>
                <div className="st-design__copy">
                  <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="st-h3">{item.title}</h3>
                  <p className="st-body">{item.body}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
