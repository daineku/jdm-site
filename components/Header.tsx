'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import logoMark from '@/public/images/brand/logo-mark.png'
import { STUDIO_NAV } from '@/components/studio/content'
import { SocialList } from '@/components/studio/SocialIcons'
import type { SocialLink } from '@/lib/social'

/**
 * Studio header. Navigation is fixed in code (STUDIO_NAV) — legacy `nav_links`
 * from site_settings are deliberately not read, so old JDM navigation can never
 * reappear here. Brand filtering lives on /archive.
 *
 * Admin routes never render this: middleware.ts sets x-is-admin and the root
 * layout skips the header server-side.
 */
export default function Header({ socials }: { socials: SocialLink[] }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hash links work from every page: on "/" they scroll, elsewhere they navigate home.
  const href = (id: string) => `/#${id}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: highlight the section currently under the header (home only).
  useEffect(() => {
    if (!isHome) { setActive(null); return }
    const ids = [...STUDIO_NAV.map(n => n.id), 'contact']
    const sections = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (sections.length === 0) return
    const visible = new Map<string, boolean>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting)
      setActive(ids.find(id => visible.get(id)) ?? null)
    }, { rootMargin: '-45% 0px -50% 0px' })
    sections.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [isHome])

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) burgerRef.current?.focus()
  }, [])

  // Close the menu on route change.
  useEffect(() => { setOpen(false) }, [pathname])

  // Menu open: lock page scroll, move focus in, trap Tab, close on Escape / desktop resize.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(true); return }
      if (e.key !== 'Tab') return
      const nodes = [burgerRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? [])]
        .filter((n): n is HTMLElement => !!n)
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    const mq = window.matchMedia('(min-width: 960px)')
    const onMq = () => { if (mq.matches) close(false) }
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open, close])

  const over = isHome && !scrolled && !open
  const cls = `studio st-header${over ? ' st-header--over' : ''}${open ? ' st-header--open' : ''}`

  return (
    <header className={cls}>
      <a href="#main" className="st-skip">Skip to content</a>
      <div className="st-container st-header__bar">
        <Link href="/" className="st-brand" aria-label="DAINEKU — home" onClick={() => setOpen(false)}>
          <Image src={logoMark} alt="" className="st-brand__mark" sizes="40px" priority />
          <span className="st-brand__word" aria-hidden="true">DAINEKU</span>
        </Link>

        <nav className="st-nav" aria-label="Primary">
          {STUDIO_NAV.map(item => (
            <a
              key={item.id}
              href={href(item.id)}
              className={`st-nav__link${active === item.id ? ' is-active' : ''}`}
              aria-current={active === item.id ? 'location' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="st-header__end">
          <a href={href('contact')} className="st-btn st-btn--green st-btn--sm st-header__cta">
            Contact <span className="st-btn__arrow" aria-hidden="true">→</span>
          </a>
          <button
            ref={burgerRef}
            type="button"
            className="st-burger"
            aria-expanded={open}
            aria-controls="st-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(v => !v)}
          >
            <span className="st-burger__lines" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="st-mobile-menu" ref={menuRef} className="st-menu" hidden={!open}>
        <nav aria-label="Mobile">
          <ul className="st-menu__list">
            {[...STUDIO_NAV, { id: 'contact', label: 'Contact' } as const].map((item, i) => (
              <li key={item.id}>
                <a href={href(item.id)} className="st-menu__link" onClick={() => close(false)}>
                  <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="st-menu__foot">
          <a href={href('contact')} className="st-btn st-btn--gold" onClick={() => close(false)}>
            Start a project <span className="st-btn__arrow st-btn__arrow--diag" aria-hidden="true">↗</span>
          </a>
          <SocialList links={socials} />
        </div>
      </div>
    </header>
  )
}
