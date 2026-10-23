import type { ReactNode } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getSiteSettings } from '@/lib/data'
import { getSocialLinks } from '@/lib/social'

/**
 * The public site frame: header, the skip-link target, the page, footer. Used by the (studio)
 * route group layout and by the not-found pages outside it, so a 404 looks like the site too.
 * The admin route never renders it.
 */
export default async function StudioShell({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  const socials = getSocialLinks(settings)
  return (
    <>
      <Header socials={socials} />
      <div id="main" tabIndex={-1} style={{ outline: 'none' }}>{children}</div>
      <Footer />
    </>
  )
}
