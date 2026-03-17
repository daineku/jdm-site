'use client'
import { useState } from 'react'
import { SettingsTab } from './components/SettingsTab'
import { BrandsTab } from './components/BrandsTab'
import { ModelEditor } from './components/ModelEditor'
import { HomepageTab } from './components/HomepageTab'
import { AccessoriesTab } from './components/AccessoriesTab'

// Spin animation for loaders
const SPIN_STYLE = `
@keyframes spin { to { transform: rotate(360deg); } }
`

type Section = 'models' | 'homepage' | 'accessories' | 'brands' | 'settings'

const NAV: { key: Section; label: string; icon: string; group: string }[] = [
  { key: 'models', label: 'Models', icon: '◈', group: 'Content' },
  { key: 'homepage', label: 'Homepage', icon: '⊞', group: 'Content' },
  { key: 'accessories', label: 'Accessories', icon: '◎', group: 'Content' },
  { key: 'brands', label: 'Brands', icon: '◇', group: 'Config' },
  { key: 'settings', label: 'Settings', icon: '◉', group: 'Config' },
]

const G = '#39FF14'
const BG = '#0a0a0a'
const SIDEBAR_W = 200

export default function AdminClient({ adminSecret }: { adminSecret: string }) {
  const [section, setSection] = useState<Section>('models')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const groups = ['Content', 'Config']

  return (
    <>
      <style>{SPIN_STYLE}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Manrope, sans-serif', color: '#fff', fontSize: 13 }}>

        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? SIDEBAR_W : 52,
          flexShrink: 0,
          background: '#0d0d0d',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
        }}>
          {/* Logo row */}
          <div style={{ padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a1a1a', gap: 10, flexShrink: 0 }}>
            <span style={{ color: G, fontWeight: 800, fontSize: 12, letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
              {sidebarOpen ? '⬡ ADMIN' : '⬡'}
            </span>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14, padding: 0 }}
                title="Collapse sidebar"
              >‹</button>
            )}
          </div>

          {/* Collapsed: just icon button to expand */}
          {!sidebarOpen && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '8px 0' }}
                title="Expand sidebar"
              >›</button>
              {NAV.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setSidebarOpen(true) }}
                  style={{ background: 'none', border: 'none', color: section === item.key ? G : '#444', cursor: 'pointer', fontSize: 14, padding: '10px 0', width: '100%', textAlign: 'center' }}
                  title={item.label}
                >{item.icon}</button>
              ))}
            </div>
          )}

          {/* Expanded nav */}
          {sidebarOpen && (
            <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
              {groups.map(group => (
                <div key={group} style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 9, color: '#333', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px 4px' }}>{group}</p>
                  {NAV.filter(n => n.group === group).map(item => {
                    const active = section === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => setSection(item.key)}
                        style={{
                          width: '100%', textAlign: 'left', background: active ? '#151515' : 'none',
                          border: 'none', borderLeft: active ? `2px solid ${G}` : '2px solid transparent',
                          color: active ? G : '#666', cursor: 'pointer', padding: '9px 16px',
                          fontSize: 12, fontWeight: active ? 700 : 500, letterSpacing: '0.04em',
                          fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'color 0.15s, background 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>
          )}

          {/* Bottom: site link */}
          {sidebarOpen && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
              <a href="/" target="_blank" style={{ fontSize: 11, color: '#333', textDecoration: 'none', letterSpacing: '0.05em' }}>↗ View site</a>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: '28px 28px 48px' }}>
          <div style={{ maxWidth: 1000 }}>
            {section === 'models' && <ModelEditor adminSecret={adminSecret} />}
            {section === 'homepage' && <HomepageTab adminSecret={adminSecret} />}
            {section === 'accessories' && <AccessoriesTab adminSecret={adminSecret} />}
            {section === 'brands' && <BrandsTab adminSecret={adminSecret} />}
            {section === 'settings' && <SettingsTab adminSecret={adminSecret} />}
          </div>
        </main>
      </div>
    </>
  )
}
