import Image from 'next/image'
import logoMark from '@/public/images/brand/logo-mark.png'
import { ABOUT } from './content'

export default function StudioAbout() {
  return (
    <section id="studio" className="st-section" aria-labelledby="studio-title">
      <div className="st-container st-about__layout">
        <div className="st-about__mark st-ticks" data-reveal="">
          <Image src={logoMark} alt="DAINEKU symbol" sizes="(max-width: 899px) 240px, 300px" />
        </div>
        <div className="st-about__copy" data-reveal="">
          <p className="st-label st-label--rule" style={{ margin: 0 }}>{ABOUT.label}</p>
          <h2 id="studio-title" className="st-h2">{ABOUT.title}</h2>
          {ABOUT.body.map(p => <p key={p.slice(0, 24)} className="st-body">{p}</p>)}
        </div>
      </div>
    </section>
  )
}
