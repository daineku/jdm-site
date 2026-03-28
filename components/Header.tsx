'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { SiteSettings, Brand } from '@/lib/types'

function SocialLink({ type, href }: { type: string; href: string }) {
  if (!href) return null
  const paths: Record<string, string> = {
    tiktok: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.26 8.26 0 004.84 1.55V7.04a4.85 4.85 0 01-1.07-.35z',
    youtube: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      aria-label={type} style={{ color: '#555', transition: 'color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#39FF14')}
      onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d={paths[type]} />
      </svg>
    </a>
  )
}

export default function Header() {
  const pathname = usePathname()
  // Header suppression for admin routes is handled server-side:
  // middleware.ts sets x-is-admin header → layout.tsx skips rendering Header.
  const [settings, setSettings] = useState<SiteSettings>({
    id: '', site_title: '', logo_url: null,
    tiktok_url: '', youtube_url: '', instagram_url: '',
    nav_links: [], updated_at: '',
  })
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings').then(r => r.json()).then(d => { if (d.settings) setSettings(d.settings) }).catch(() => {})
    fetch('/api/brands').then(r => r.json()).then(d => { if (d.brands) setBrands(d.brands) }).catch(() => {})
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setBrandsOpen(false) }, [pathname])

  const headerBg = scrolled ? 'rgba(10,10,10,0.96)' : 'transparent'
  const headerBorder = scrolled ? '1px solid #1a1a1a' : '1px solid transparent'

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: headerBg, backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: headerBorder, transition: 'background 0.3s, border-color 0.3s' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            {settings.logo_url ? (
              <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
                <Image src={settings.logo_url} alt={`${settings.site_title || 'DAINEKU'} logo`} fill style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 32, height: 32, background: '#39FF14', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000', letterSpacing: '0.05em', flexShrink: 0 }}>
                JDM
              </div>
            )}
            <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.15em', color: '#fff', fontFamily: 'Manrope, sans-serif' }}>
              {settings.site_title}
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {settings.tiktok_url && <SocialLink type="tiktok" href={settings.tiktok_url} />}
            {settings.youtube_url && <SocialLink type="youtube" href={settings.youtube_url} />}
            {settings.instagram_url && <SocialLink type="instagram" href={settings.instagram_url} />}
          </div>
        </div>

        {/* Nav row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderTop: '1px solid #161616' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 10 }}>
            {(settings.nav_links || []).map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#39FF14' : '#555', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#39FF14' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#555' }}>
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Brands dropdown */}
          {brands.length > 0 && (
            <div style={{ position: 'relative', paddingTop: 10 }}>
              <button
                onClick={() => setBrandsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', fontFamily: 'Manrope, sans-serif', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#39FF14')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                Brands
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transform: brandsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {brandsOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 140, background: '#111', border: '1px solid #1e1e1e', borderRadius: 2, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {brands.map(brand => (
                    <Link key={brand.id} href={`/?brand=${brand.slug}`}
                      style={{ display: 'block', padding: '9px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', textDecoration: 'none', transition: 'color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#39FF14'; (e.currentTarget as HTMLElement).style.background = '#161616' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      {brand.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
