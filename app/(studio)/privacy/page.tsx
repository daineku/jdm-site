import type { Metadata } from 'next'
import LegalPage, { type LegalSection } from '@/components/studio/LegalPage'
import { LEGAL_UPDATED } from '@/lib/seo'

// Written from the implementation (October 2026): no cookies or browser storage on the public
// site, no analytics configured, enquiries emailed via Resend and not stored, content in
// Supabase, media on Cloudflare R2, hosting on Vercel. Update this page when any of that changes.

const TITLE = 'Privacy Policy'
const DESCRIPTION = 'How the DAINEKU website handles project enquiries, server request data and third-party services.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { type: 'website', url: '/privacy', siteName: 'DAINEKU', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
  twitter: { card: 'summary', title: `${TITLE} | DAINEKU`, description: DESCRIPTION },
}

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'What this policy covers',
    body: (
      <p>
        This policy covers daineku.com, the website of DAINEKU, a studio developing real-time simulations, interactive
        software, digital environments and cinematic content. It explains what information the website processes,
        why, and which service providers are involved. It does not cover client projects, which are governed by the
        agreement made for each project, or other websites linked from this one.
      </p>
    ),
  },
  {
    id: 'enquiries',
    title: 'Project enquiries',
    body: (
      <>
        <p>
          When the enquiry form is available and you send it, the website receives your name, email address, the
          project type you chose, an optional timeline and your project description. These details are used only to
          read and reply to your enquiry and any correspondence that follows.
        </p>
        <p>
          The website does not keep enquiries in a database. On submission they are checked and passed straight to our
          email delivery provider, Resend, which delivers them as an email to the studio&rsquo;s inbox. Your email address
          is set as the reply address so that we can answer you directly. Resend processes the message to deliver it
          and keeps delivery records in line with its own privacy policy. The enquiry then remains in the studio&rsquo;s
          mailbox for as long as it is needed for the correspondence.
        </p>
        <p>
          To limit automated abuse, the server briefly keeps the IP address of each submission in memory to count how
          many enquiries arrive from the same address in a short period. This is not written to a database and is
          discarded within minutes. The form also contains a hidden field that people never see; submissions that fill
          it in are discarded.
        </p>
        <p>Please do not include confidential or sensitive personal information in an enquiry.</p>
      </>
    ),
  },
  {
    id: 'server-data',
    title: 'Server request data',
    body: (
      <p>
        Like any website, pages are delivered by servers that receive technical request data: your IP address, browser
        and device type, the page requested, the referring page and the time of the request. Our hosting and network
        providers process this to deliver pages and to keep the service secure and available. We do not use it to
        build profiles of visitors.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies, analytics and advertising',
    body: (
      <p>
        The public website does not set cookies, does not use browser storage to track you and does not run analytics
        or advertising scripts. Fonts are served from this website rather than from a third-party font service. If
        analytics or any other tracking is introduced in future, this policy will be updated before it is switched on.
      </p>
    ),
  },
  {
    id: 'providers',
    title: 'Service providers',
    body: (
      <>
        <p>The website relies on these providers, each acting under its own terms and privacy policy:</p>
        <ul>
          <li><strong>Vercel</strong> hosts and serves the website.</li>
          <li><strong>Cloudflare</strong> provides the domain&rsquo;s DNS and network services, and stores and serves images used on the site.</li>
          <li><strong>Supabase</strong> stores the website&rsquo;s own content, such as articles and settings. It holds no information about visitors.</li>
          <li><strong>Resend</strong> delivers project enquiries by email.</li>
        </ul>
        <p>These providers may process data in countries other than your own.</p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'External links and embedded content',
    body: (
      <p>
        The website links to other sites, such as the website of our project The Kanjo, our social media profiles and,
        where shown, a Patreon page. Those sites are not operated by us and have their own privacy practices; we
        receive nothing from them when you follow a link. Some pages of the website&rsquo;s older car archive embed
        TikTok videos. An embedded video loads content directly from TikTok, which may receive request data and set its
        own cookies under its own policy.
      </p>
    ),
  },
  {
    id: 'choices',
    title: 'Your choices and requests',
    body: (
      <p>
        Sending an enquiry is optional. If you have written to us and would like to know what correspondence we hold,
        have it corrected, or have it deleted, reply to any email you have received from the studio or contact the
        studio through this website, and we will respond.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        This policy will be updated when the website starts to process information in a new way. The date at the top
        of this page shows when it last changed.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title={TITLE}
      updated={LEGAL_UPDATED.privacy}
      intro="DAINEKU’s website is designed to collect as little as possible: there are no accounts, no cookies on the public site and no analytics. The only personal information it handles is what you choose to send in a project enquiry."
      sections={sections}
      other={{ href: '/terms', label: 'Terms of Use' }}
    />
  )
}
