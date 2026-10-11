'use client'
import { useEffect } from 'react'

/**
 * Arms the scroll reveal for every `[data-reveal]` element on the page.
 * Content is fully visible in the server HTML; the hidden start state is only
 * applied once this has mounted, and never when the user prefers reduced motion.
 * Renders nothing.
 */
export default function Reveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const root = document.documentElement
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    // Anything already on screen (e.g. after a hash jump) stays put — no flash.
    const fold = window.innerHeight
    for (const el of targets) {
      if (el.getBoundingClientRect().top < fold) el.classList.add('is-in')
    }
    root.classList.add('st-reveal-ready')

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    for (const el of targets) if (!el.classList.contains('is-in')) io.observe(el)

    return () => {
      io.disconnect()
      root.classList.remove('st-reveal-ready')
    }
  }, [])

  return null
}
