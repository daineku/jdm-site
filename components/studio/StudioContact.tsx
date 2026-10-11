import type { SocialLink } from '@/lib/social'
import { CONTACT } from './content'
import ContactForm from './ContactForm'
import { SectionHeading } from './primitives'
import { SocialList } from './SocialIcons'

/**
 * The enquiry recipient is configured only on the server (CONTACT_TO_EMAIL).
 * Never display or pass that address to client components or public markup.
 * Show the form only when the outbound mail provider is ready.
 */
export default function StudioContact({ deliveryReady, socials }: {
  deliveryReady: boolean
  socials: SocialLink[]
}) {
  return (
    <section id="contact" className="st-section st-contact" aria-labelledby="contact-title">
      <div className="st-container">
        <SectionHeading id="contact-title" label={CONTACT.label} title={CONTACT.title} lead={CONTACT.body} className="st-section-head" />
        <div className={`st-contact__grid${deliveryReady ? '' : ' st-contact__grid--solo'}`} data-reveal="">
          <div className="st-card st-contact__info">
            <p className="st-body">{CONTACT.scope}</p>
            {socials.length > 0 && (
              <div className="st-contact__item">
                <p className="st-label st-label--muted" style={{ margin: 0 }}>Follow DAINEKU</p>
                <SocialList links={socials} />
              </div>
            )}
            {!deliveryReady && <p className="st-body">The project enquiry form is being prepared.</p>}
          </div>
          {deliveryReady && <div className="st-card"><ContactForm email={null} delivery="server" cta={CONTACT.cta} /></div>}
        </div>
      </div>
    </section>
  )
}
