import type { SocialLink } from '@/lib/social'
import { CONTACT } from './content'
import ContactForm, { type ContactDelivery } from './ContactForm'
import { SectionHeading } from './primitives'
import { SocialList } from './SocialIcons'

/**
 * Contact block. Only real channels are shown:
 *  - the enquiry form, when an email provider is configured (server delivery) or a public
 *    address exists (mailto fallback);
 *  - the public address (CONTACT_EMAIL) as a direct link;
 *  - social profiles configured in site_settings.
 * With none configured, the section states that plainly instead of faking a contact.
 */
export default function StudioContact({ email, delivery, socials }: {
  email: string | null
  delivery: ContactDelivery | null
  socials: SocialLink[]
}) {
  const hasChannel = !!email || !!delivery || socials.length > 0
  return (
    <section id="contact" className="st-section st-contact" aria-labelledby="contact-title">
      <div className="st-container">
        <SectionHeading id="contact-title" label={CONTACT.label} title={CONTACT.title} lead={CONTACT.body} className="st-section-head" />

        <div className={`st-contact__grid${delivery ? '' : ' st-contact__grid--solo'}`} data-reveal="">
          <div className="st-card st-contact__info">
            {email && (
              <div className="st-contact__item">
                <p className="st-label st-label--muted" style={{ margin: 0 }}>Email</p>
                <a className="st-contact__email" href={`mailto:${email}`}>{email}</a>
              </div>
            )}
            {socials.length > 0 && (
              <div className="st-contact__item">
                <p className="st-label st-label--muted" style={{ margin: 0 }}>{email ? 'Elsewhere' : 'Reach the studio'}</p>
                <SocialList links={socials} />
              </div>
            )}
            {!hasChannel && (
              <p className="st-body">Contact details are being set up. Please check back shortly.</p>
            )}
            <p className="st-body" style={{ fontSize: 14 }}>{CONTACT.scope}</p>
          </div>

          {delivery && (
            <div className="st-card">
              <ContactForm email={email} delivery={delivery} cta={CONTACT.cta} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
