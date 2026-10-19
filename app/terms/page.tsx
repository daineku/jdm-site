import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { type LegalSection } from '@/components/studio/LegalPage'
import { LEGAL_UPDATED } from '@/lib/seo'

// Production draft (October 2026). Deliberately names no legal entity, address or governing law —
// none has been provided. See the owner note in components/studio/LegalPage.tsx.

const TITLE = 'Terms of Use'
const DESCRIPTION = 'The terms for using the DAINEKU website, its portfolio, articles and project enquiry form.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: { type: 'website', url: '/terms', siteName: 'DAINEKU', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
  twitter: { card: 'summary', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
}

const sections: LegalSection[] = [
  {
    id: 'use',
    title: 'Using this website',
    body: (
      <>
        <p>
          You are welcome to browse the website, read its articles, and link to or share its pages. When you do, please
          do not:
        </p>
        <ul>
          <li>attempt to access the administration area or any part of the service that is not public;</li>
          <li>interfere with the website&rsquo;s operation, security or availability, including through automated mass requests;</li>
          <li>use the enquiry form to send spam, unlawful content or messages unrelated to a project;</li>
          <li>present the studio&rsquo;s work as your own or imply an association with DAINEKU that does not exist.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'work',
    title: 'Portfolio and project information',
    body: (
      <>
        <p>
          The projects shown on this website are the studio&rsquo;s own work. The Kanjo is an original DAINEKU project in
          development: its features, content and presentation may change or be removed, and nothing shown is a promise
          that it will appear in a released product. No release date, platform or price is confirmed unless DAINEKU has
          announced it.
        </p>
        <p>
          Descriptions of services and capabilities are general information about the kind of work the studio does.
          They are not an offer, a quotation or a guarantee of availability.
        </p>
      </>
    ),
  },
  {
    id: 'enquiries',
    title: 'Project enquiries',
    body: (
      <p>
        Sending an enquiry does not create an agreement or any obligation for either side. Any commissioned work is
        governed by a separate written agreement covering its scope, schedule, fees, deliverables and ownership. Please
        do not send confidential material until such an agreement, or a confidentiality agreement, is in place. How
        enquiries are handled is described in the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <>
        <p>
          The DAINEKU name and logos, The Kanjo name and artwork, and the images, video, text, designs and software
          shown on this website belong to DAINEKU or are used with permission. Sharing a link, or quoting a short passage
          with a link back to its source, is fine.
        </p>
        <p>
          Otherwise, please do not copy, republish, modify or use the material commercially, including to train or
          prompt AI systems, without written permission from the studio.
        </p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party names, services and links',
    body: (
      <p>
        Names of other companies, products, vehicles and platforms mentioned on the website belong to their owners and
        are used only to describe or identify them; their appearance does not imply endorsement or affiliation. Links
        and embedded content from other services, such as Patreon, TikTok or social media platforms, are governed by
        those services&rsquo; own terms, and DAINEKU is not responsible for their content, availability or practices.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and accuracy',
    body: (
      <p>
        The website is provided as it is. It may change, be unavailable from time to time or be withdrawn without
        notice. We aim to keep its information accurate and current, but do not guarantee that it is complete,
        error-free or suitable for any particular purpose. Nothing in these terms limits any rights you have that
        cannot lawfully be limited.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        These terms may be updated, for example when the website or the services it describes change. The date at the
        top of this page shows when they last changed, and continuing to use the website after a change means you
        accept the updated terms.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title={TITLE}
      updated={LEGAL_UPDATED.terms}
      intro="These terms apply to your use of daineku.com, the website of DAINEKU, a studio developing real-time simulations, interactive software, digital environments and cinematic content."
      sections={sections}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  )
}
