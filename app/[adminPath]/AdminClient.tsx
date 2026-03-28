'use client'
import { useState } from 'react'
import { SettingsTab } from './components/SettingsTab'
import { BrandsTab } from './components/BrandsTab'
import { ModelEditor } from './components/ModelEditor'
import { HomepageTab } from './components/HomepageTab'
import { AccessoriesTab } from './components/AccessoriesTab'
import { BuildCategoriesTab } from './components/BuildCategoriesTab'
import { PartCategoriesTab } from './components/PartCategoriesTab'
import { BuildsSection } from './components/BuildsSection'
import { PartsSection } from './components/PartsSection'
import { isAdminEnabled } from '@/lib/features'

const SPIN_STYLE = `@keyframes spin { to { transform: rotate(360deg); } }`

// ── Canonical admin IA ────────────────────────────────────────────────────────
// GLOBAL  — entities that exist independently of any model (taxonomies, config)
//   Site Settings
//   Build Categories   (v5, feature-flagged)
// CONTENT — curated site content and model data
//   Models, Homepage, Accessories, Brands
// ─────────────────────────────────────────────────────────────────────────────

type CoreSection = 'models' | 'homepage' | 'accessories' | 'brands' | 'settings'
type V5Section   = 'builds' | 'parts' | 'build-categories' | 'part-categories'
type Section     = CoreSection | V5Section

const G  = '#39FF14'
const BG = '#0a0a0a'
const SIDEBAR_W = 210

export default function AdminClient({ adminSecret }: { adminSecret: string }) {
  const [section, setSection]     = useState<Section>('models')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  type NavItem = { key: Section; label: string; icon: string; group: string }

  const NAV: NavItem[] = [
    { key: 'settings',    label: 'Site Settings', icon: '\u25C9', group: 'Global' },
    { key: 'builds',      label: 'Builds',        icon: '\u25C8', group: 'Global' },
    { key: 'parts',       label: 'Parts',         icon: '\u25A6', group: 'Global' },
    { key: 'models',      label: 'Models',        icon: '\u2B21', group: 'Content' },
    { key: 'homepage',    label: 'Homepage',      icon: '\u229E', group: 'Content' },
    { key: 'brands',      label: 'Brands',        icon: '\u25C7', group: 'Content' },
    { key: 'accessories', label: 'Accessories ⚠ Legacy', icon: '\u25CE', group: 'Legacy' },
  ]

  const groups = ['Global', 'Content', 'Legacy']

  const renderSection = () => {
    switch (section) {
      case 'models':           return <ModelEditor adminSecret={adminSecret} />
      case 'homepage':         return <HomepageTab adminSecret={adminSecret} />
      case 'accessories':      return <AccessoriesTab adminSecret={adminSecret} />
      case 'brands':           return <BrandsTab adminSecret={adminSecret} />
      case 'settings':         return <SettingsTab adminSecret={adminSecret} />
      case 'builds':           return <BuildsSection       adminSecret={adminSecret} />
      case 'parts':            return <PartsSection        adminSecret={adminSecret} />
      case 'build-categories': return <BuildCategoriesTab  adminSecret={adminSecret} />
      case 'part-categories':  return <PartCategoriesTab   adminSecret={adminSecret} />
      default:                 return null
    }
  }

  return (
    <>
      <style>{SPIN_STYLE}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Manrope, sans-serif', color: '#fff', fontSize: 13 }}>

        <aside style={{
          width: sidebarOpen ? SIDEBAR_W : 52, flexShrink: 0,
          background: '#0d0d0d', borderRight: '1px solid #1a1a1a',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease', overflow: 'hidden',
          position: 'sticky', top: 0, height: '100vh', zIndex: 50,
        }}>
          <div style={{ padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a1a1a', gap: 10, flexShrink: 0 }}>
            <span style={{ color: G, fontWeight: 800, fontSize: 12, letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
              {sidebarOpen ? '\u2B21 ADMIN' : '\u2B21'}
            </span>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14, padding: 0 }}
                title="Collapse">\u2039</button>
            )}
          </div>

          {!sidebarOpen && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
              <button onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '8px 0' }}
                title="Expand">\u203A</button>
              {NAV.map(item => (
                <button key={item.key} onClick={() => { setSection(item.key); setSidebarOpen(true) }}
                  style={{ background: 'none', border: 'none', color: section === item.key ? G : '#444', cursor: 'pointer', fontSize: 14, padding: '10px 0', width: '100%', textAlign: 'center' }}
                  title={item.label}>{item.icon}</button>
              ))}
            </div>
          )}

          {sidebarOpen && (
            <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
              {groups.map(group => {
                const items = NAV.filter(n => n.group === group)
                if (items.length === 0) return null
                return (
                  <div key={group} style={{ marginBottom: 4 }}>
                    <p style={{ fontSize: 9, color: '#333', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px 4px' }}>{group}</p>
                    {items.map(item => {
                      const active = section === item.key
                      return (
                        <button key={item.key} onClick={() => setSection(item.key)}
                          style={{ width: '100%', textAlign: 'left', background: active ? '#151515' : 'none', border: 'none', borderLeft: active ? `2px solid ${G}` : '2px solid transparent', color: active ? G : '#666', cursor: 'pointer', padding: '9px 16px', fontSize: 12, fontWeight: active ? 700 : 500, letterSpacing: '0.04em', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 10, transition: 'color 0.15s, background 0.15s', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </nav>
          )}

          {sidebarOpen && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
              <a href="/" target="_blank" style={{ fontSize: 11, color: '#333', textDecoration: 'none', letterSpacing: '0.05em' }}>\u2197 View site</a>
            </div>
          )}
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: '28px 28px 48px' }}>
          <div style={{ maxWidth: 1000 }}>
            {renderSection()}
          </div>
        </main>
      </div>
    </>
  )
}
