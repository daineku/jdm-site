import Image from 'next/image'
import hero from '@/public/images/brand/hero.png'
import { HERO } from './content'
import { Arrow } from './primitives'

export default function StudioHero() {
  return (
    <section className="st-hero" aria-labelledby="hero-title">
      <div className="st-hero__media">
        <Image
          src={hero}
          alt="A night-time city: a building half-resolved as a wireframe beside finished towers, and a white sports car on a wet, curving elevated road."
          fill
          priority
          quality={85}
          sizes="100vw"
          className="st-hero__img"
        />
        <div className="st-hero__shade" />
      </div>

      <div className="st-container st-hero__content">
        <div className="st-hero__copy">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{HERO.eyebrow}</p>
          <h1 id="hero-title" className="st-h1 st-hero__h1">{HERO.headline}</h1>
          <p className="st-lead st-hero__body">{HERO.body}</p>
          <div className="st-hero__ctas">
            <a href="#work" className="st-btn st-btn--gold">{HERO.primaryCta} <Arrow /></a>
            <a href="#contact" className="st-btn st-btn--ghost">{HERO.secondaryCta} <Arrow diagonal /></a>
          </div>
        </div>
      </div>

      <div className="st-hero__meta">
        <div className="st-container st-hero__meta-row">
          <ul className="st-hero__disciplines" aria-label="Focus areas">
            {HERO.disciplines.map((d, i) => (
              <li key={d}>
                <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="st-label">{d}</span>
              </li>
            ))}
          </ul>
          <span className="st-hero__scroll" aria-hidden="true">
            Scroll <span className="st-hero__scroll-line" />
          </span>
        </div>
      </div>
    </section>
  )
}
